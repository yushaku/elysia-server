// Service handle business logic, decoupled from Elysia controller
import { z } from 'zod';
import { prisma } from '@/config/database';
import { getRedis } from '@/config/redis';
import { env } from '@/config/env';
import { sendOtpEmail } from '@/utils/email';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@/utils/exceptions';
import type { UserModel } from './model';

// Email validation schema
const emailSchema = z.email({ message: 'Invalid email format' });

export abstract class UserService {
  /**
   * Generate Google OAuth login URL
   */
  static getGoogleLoginUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    id_token: string;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new InternalServerErrorException(
        `Failed to exchange code: ${error}`,
        'GoogleOAuthError',
      );
    }

    return (await response.json()) as {
      access_token: string;
      id_token: string;
    };
  }

  /**
   * Get user info from Google using access token
   */
  static async getGoogleUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name?: string;
    picture?: string;
    verified_email: boolean;
  }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new InternalServerErrorException(
        `Failed to get user info: ${error}`,
        'GoogleUserInfoError',
      );
    }

    return (await response.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
      verified_email: boolean;
    };
  }

  /**
   * Find or create user from Google OAuth
   */
  static async findOrCreateUser(googleUser: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    verified_email: boolean;
  }): Promise<UserModel.userData> {
    const user = await prisma.user.upsert({
      where: {
        googleId: googleUser.id,
      },
      update: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        emailVerified: googleUser.verified_email,
        updatedAt: new Date(),
      },
      create: {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        picture: googleUser.picture,
        emailVerified: googleUser.verified_email,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      picture: user.picture ?? undefined,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Generate a 6-character alphanumeric OTP code (numbers + uppercase letters)
   */
  static generateOtpCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Send OTP code to email
   */
  static async sendOtp(email: string): Promise<void> {
    emailSchema.parse(email);

    // Generate OTP code
    const code = this.generateOtpCode();
    const redis = getRedis();
    const otpKey = `otp:${email}`;
    const ttl = 1 * 60; // 1 minute in seconds

    await redis.del(otpKey);
    await redis.setex(otpKey, ttl, code);

    // Send OTP via email
    await sendOtpEmail(email, code);
  }

  /**
   * Verify OTP code and login/create user
   */
  static async verifyOtpAndLogin(email: string, code: string): Promise<UserModel.userData> {
    emailSchema.parse(email);

    const redis = getRedis();
    const otpKey = `otp:${email}`;

    // Verify OTP from Redis
    const storedCode = await redis.get(otpKey);
    if (!storedCode || storedCode !== code) {
      throw new BadRequestException('Invalid or expired OTP code', 'InvalidOtp');
    }
    await redis.del(otpKey);

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        emailVerified: true,
        updatedAt: new Date(),
      },
      create: {
        email,
        emailVerified: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      picture: user.picture ?? undefined,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Get user by ID (for authenticated requests)
   */
  static async getUserById(userId: string): Promise<UserModel.userData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found', 'UserNotFound');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      picture: user.picture ?? '',
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
