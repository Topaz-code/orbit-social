import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { JWT_SECRET } from '../config/auth.js';

export class TwoFactorService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   */
  public generateOTP(): string {
    const num = crypto.randomInt(100000, 999999);
    return num.toString();
  }

  /**
   * Computes HMAC-SHA256 of the OTP for secure database storage.
   */
  private hashOTP(otp: string): string {
    return crypto.createHmac('sha256', JWT_SECRET).update(otp.trim()).digest('hex');
  }

  /**
   * Creates a time-limited 6-digit OTP for 2FA login verification.
   */
  public async createLoginOTP(userId: string): Promise<string> {
    // Delete any prior OTPs for this user
    await prisma.otpCode.deleteMany({
      where: {
        user_id: userId,
        type: 'LOGIN_2FA',
      },
    });

    const rawOTP = this.generateOTP();
    const code_hash = this.hashOTP(rawOTP);
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await prisma.otpCode.create({
      data: {
        user_id: userId,
        code_hash,
        type: 'LOGIN_2FA',
        expires_at,
        attempts: 0,
      },
    });

    console.log(`🔐 [2FA] Generated login OTP for user ${userId}: ${rawOTP} (Valid for 5 mins)`);
    return rawOTP;
  }

  /**
   * Verifies an entered OTP code against the database.
   */
  public async verifyLoginOTP(userId: string, enteredOTP: string): Promise<{ valid: boolean; reason?: string }> {
    const record = await prisma.otpCode.findFirst({
      where: {
        user_id: userId,
        type: 'LOGIN_2FA',
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      return { valid: false, reason: 'Verification code has expired or does not exist. Please request a new code.' };
    }

    // Brute force protection: maximum 5 attempts per OTP
    if (record.attempts >= 5) {
      await prisma.otpCode.delete({ where: { id: record.id } });
      return { valid: false, reason: 'Too many incorrect attempts. Please request a new verification code.' };
    }

    const expectedHash = record.code_hash;
    const providedHash = this.hashOTP(enteredOTP);

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(providedHash, 'hex')
    );

    if (!isMatch) {
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return { valid: false, reason: `Invalid verification code (${4 - record.attempts} attempts remaining)` };
    }

    // Success: consume the code so it cannot be replayed
    await prisma.otpCode.delete({ where: { id: record.id } });
    return { valid: true };
  }

  /**
   * Toggles 2FA setting on a user account.
   */
  public async set2FAStatus(userId: string, enabled: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { two_factor_enabled: enabled },
      select: { id: true, username: true, two_factor_enabled: true },
    });
  }
}

export const twoFactorService = new TwoFactorService();
