// lib/auth.ts
import { jwtVerify } from 'jose';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

export async function verifyRefreshToken(
  token: string
): Promise<null | { id: number; email: string; userName: string }> {
  console.log('🔑 Verifying refresh token...');

  try {
    const secret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
    const { payload } = await jwtVerify(token, secret);

    console.log('✅ JWT payload decoded:', {
      userId: payload.userId,
      email: payload.email,
      userName: payload.userName,
      exp: payload.exp,
    });

    // Kiểm tra token có hết hạn chưa
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('❌ Token expired');
      return null;
    }

    return {
      id: payload.userId as number,
      email: payload.email as string,
      userName: payload.userName as string,
    };
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return null;
  }
}
