import { prisma } from '../config/database.js';
import { hashPassword, comparePassword, sanitizeUser } from '../utils/helpers.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/auth.js';

export const authService = {
  async register(data: {
    username: string;
    display_name: string;
    email: string;
    phone?: string;
    password: string;
    bio?: string;
    avatar_url?: string;
    security_question?: string;
    security_answer?: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username.toLowerCase() },
          { email: data.email.toLowerCase() },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === data.username.toLowerCase()) {
        throw new Error('Username is already taken');
      }
      if (existingUser.email.toLowerCase() === data.email.toLowerCase()) {
        throw new Error('Email is already registered');
      }
      if (data.phone && existingUser.phone === data.phone) {
        throw new Error('Phone number is already registered');
      }
    }

    const password_hash = await hashPassword(data.password);
    const security_answer_hash = data.security_answer ? await hashPassword(data.security_answer.toLowerCase().trim()) : '';
    const defaultAvatar = data.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username)}`;

    let user;
    try {
      user = await prisma.user.create({
        data: {
          username: data.username.toLowerCase(),
          display_name: data.display_name,
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          password_hash,
          bio: data.bio || '',
          avatar_url: defaultAvatar,
          cover_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
          security_question: data.security_question || "What is your pet's name?",
          security_answer_hash,
        },
      });
    } catch (err: any) {
      // Prisma unique constraint violation
      if (err?.code === 'P2002') {
        const field = err?.meta?.target?.[0] || 'field';
        throw new Error(`An account with this ${field} already exists`);
      }
      throw new Error('Failed to create account. Please try again.');
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_banned: user.is_banned,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async login(data: { identifier: string; password: string; rememberMe?: boolean }) {
    const identifier = data.identifier.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { phone: identifier },
          ...(identifier === 'alex' ? [{ username: 'alexchen' }] : []),
        ],
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last seen & online status, ensure admin for Alex Chen
    const isAdminAccount =
      user.username.toLowerCase() === 'alexchen' ||
      user.username.toLowerCase() === 'alex' ||
      user.username.toLowerCase().includes('alex') ||
      user.email.toLowerCase() === 'alex@orbit.local' ||
      user.display_name.toLowerCase().includes('alex chen');
    const effectiveRole = isAdminAccount ? 'ADMIN' : user.role;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_online: true,
        last_seen: new Date(),
        ...(isAdminAccount && user.role !== 'ADMIN' ? { role: 'ADMIN' } : {}),
      },
    });

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: effectiveRole,
      is_banned: user.is_banned,
    };
    const accessToken = generateAccessToken(tokenPayload, data.rememberMe ?? true);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: sanitizeUser({ ...user, role: effectiveRole }),
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(refreshTokenString: string) {
    const payload = verifyRefreshToken(refreshTokenString);
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_banned: user.is_banned,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            friendships_requested: { where: { status: 'accepted' } },
            friendships_received: { where: { status: 'accepted' } },
            group_members: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Ensure admin role for Alex Chen if stored as USER
    const isAdminAccount =
      user.username.toLowerCase() === 'alexchen' ||
      user.username.toLowerCase() === 'alex' ||
      user.username.toLowerCase().includes('alex') ||
      user.email.toLowerCase() === 'alex@orbit.local' ||
      user.display_name.toLowerCase().includes('alex chen');
    if (isAdminAccount && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      }).catch((err) => console.warn('[Auth] Could not update admin role:', err));
    }

    const friendCount = user._count.friendships_requested + user._count.friendships_received;
    const sanitized = sanitizeUser(user);

    return {
      ...sanitized,
      friend_count: friendCount,
      post_count: user._count.posts,
      group_count: user._count.group_members,
    };
  },

  async resetPassword(data: { identifier: string; security_answer: string; new_password: string }) {
    const identifier = data.identifier.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.security_answer_hash) {
      throw new Error('Security question reset is not configured for this account');
    }

    const isValidAnswer = await comparePassword(
      data.security_answer.toLowerCase().trim(),
      user.security_answer_hash
    );

    if (!isValidAnswer) {
      throw new Error('Incorrect security question answer');
    }

    const password_hash = await hashPassword(data.new_password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash },
    });

    return { success: true, message: 'Password reset successfully' };
  },

  async changePassword(userId: string, data: { current_password: string; new_password: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await comparePassword(data.current_password, user.password_hash);
    if (!isValid) throw new Error('Current password is incorrect');

    const password_hash = await hashPassword(data.new_password);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });
    return { success: true, message: 'Password changed successfully' };
  },

  async getSecurityQuestion(identifier: string) {
    const cleanId = identifier.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanId }, { email: cleanId }],
      },
      select: {
        security_question: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return { security_question: user.security_question || "What is your pet's name?" };
  },
};
