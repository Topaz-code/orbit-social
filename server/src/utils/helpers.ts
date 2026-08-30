import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function parseJson<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { password_hash, security_answer_hash, ...safeUser } = user;
  return {
    ...safeUser,
    privacy_settings: typeof safeUser.privacy_settings === 'string'
      ? parseJson(safeUser.privacy_settings, {})
      : safeUser.privacy_settings,
  };
}
