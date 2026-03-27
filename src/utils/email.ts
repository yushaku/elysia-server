import { Resend } from 'resend';
import { env } from '@/config/env';
import { log } from '@/utils/logger';

// Create Resend client instance
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Send OTP code to email using Resend
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  // If Resend is not configured, fall back to console logging
  if (!resend || !env.RESEND_API_KEY) {
    log.warn(
      {
        event: 'email.otp.dev_fallback',
        email,
        code,
        reason: 'RESEND_API_KEY not configured',
      },
      'OTP email fallback (Resend not configured)',
    );
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'Your Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Login Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 1 minute.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      log.error({ event: 'email.otp.error', err: error, email }, 'Failed to send OTP email');
      throw new Error(`Failed to send OTP email: ${JSON.stringify(error)}`);
    }

    log.info({ event: 'email.otp.sent', email, resendId: data?.id }, 'OTP email sent');
  } catch (error) {
    log.error({ event: 'email.otp.error', err: error, email }, 'Failed to send OTP email');
    throw error;
  }
}
