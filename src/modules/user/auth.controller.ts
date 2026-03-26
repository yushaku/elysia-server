// Auth controller - handles authentication endpoints
import { Elysia, t } from 'elysia';
import { jwtPlugin } from '@/middleware/auth';
import { UserService } from './user.service';
import { UserModel } from './model';
import { BadRequestException } from '@/utils/exceptions';

export const authController = new Elysia({ prefix: '/auth' })
  // Base JWT plugin for routes that issue tokens (login, callbacks, etc.)
  .use(jwtPlugin)
  .get(
    '/google',
    () => {
      const url = UserService.getGoogleLoginUrl();
      return {
        success: true,
        data: { url },
      };
    },
    {
      detail: {
        summary: 'Get Google Login URL',
        description: 'Returns the Google OAuth login URL',
        tags: ['auth'],
      },
      response: {
        200: UserModel.loginUrlResponse,
      },
    },
  )
  .get(
    '/google/callback',
    async ({ jwt, query, set }) => {
      const { code } = query as UserModel.googleCallbackQuery;

      if (!code) {
        throw new BadRequestException('Authorization code is required', 'MissingCode');
      }

      const tokens = await UserService.exchangeCodeForToken(code);
      const googleUser = await UserService.getGoogleUserInfo(tokens.access_token);
      const user = await UserService.findOrCreateUser(googleUser);
      const token = await jwt.sign({ userId: user.id });

      // Set access token in cookie
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = [
        `accessToken=${token}`,
        'HttpOnly',
        isProduction ? 'Secure' : '',
        'SameSite=Lax',
        `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
        'Path=/',
      ]
        .filter(Boolean)
        .join('; ');

      set.headers['Set-Cookie'] = cookieOptions;

      return {
        success: true,
        data: {
          user,
          token,
        },
        message: 'Login successful',
      };
    },
    {
      query: UserModel.googleCallbackQuery,
      detail: {
        summary: 'Google OAuth Callback',
        description: 'Handles Google OAuth callback and creates/updates user',
        tags: ['auth'],
      },
      response: {
        200: UserModel.authResponse,
        400: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String(), message: t.String() }),
      },
    },
  )
  .post(
    '/email/send-otp',
    async ({ body }) => {
      const { email } = body as UserModel.sendOtpRequest;

      await UserService.sendOtp(email);

      return {
        success: true,
        message: 'OTP code sent to your email',
      };
    },
    {
      body: UserModel.sendOtpRequest,
      detail: {
        summary: 'Send OTP to Email',
        description: 'Sends a 6-digit OTP code to the provided email address',
        tags: ['auth'],
      },
      response: {
        200: UserModel.sendOtpResponse,
        400: t.Object({ error: t.String(), message: t.String() }),
      },
    },
  )
  .post(
    '/email/verify-otp',
    async ({ jwt, body, set }) => {
      const { email, code } = body as UserModel.verifyOtpRequest;

      const user = await UserService.verifyOtpAndLogin(email, code);
      const token = await jwt.sign({ userId: user.id });

      // Set access token in cookie
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = [
        `accessToken=${token}`,
        'HttpOnly',
        isProduction ? 'Secure' : '',
        'SameSite=Lax',
        `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
        'Path=/',
      ]
        .filter(Boolean)
        .join('; ');

      set.headers['Set-Cookie'] = cookieOptions;

      return {
        success: true,
        data: {
          user,
          token,
        },
        message: 'Login successful',
      };
    },
    {
      body: UserModel.verifyOtpRequest,
      detail: {
        summary: 'Verify OTP and Login',
        description: 'Verifies the OTP code and logs in the user',
        tags: ['auth'],
      },
      response: {
        200: UserModel.authResponse,
        400: t.Object({ error: t.String(), message: t.String() }),
      },
    },
  )
  .post(
    '/signout',
    async ({ set }) => {
      // Clear access token cookie by setting it with Max-Age=0
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = [
        'accessToken=',
        'HttpOnly',
        isProduction ? 'Secure' : '',
        'SameSite=Lax',
        'Max-Age=0',
        'Path=/',
      ]
        .filter(Boolean)
        .join('; ');

      set.headers['Set-Cookie'] = cookieOptions;

      return {
        success: true,
        message: 'Sign out successful',
      };
    },
    {
      detail: {
        summary: 'Sign Out',
        description: 'Signs out the current user by clearing the access token cookie',
        tags: ['auth'],
      },
      response: {
        200: UserModel.signOutResponse,
      },
    },
  );
