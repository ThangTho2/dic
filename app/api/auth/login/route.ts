import { NextRequest, NextResponse } from 'next/server';
import type { LoginResponse } from '@/types/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    let result: LoginResponse;

    if (!email || !password) {
      result = { error: 'Email và mật khẩu là bắt buộc' };
      return NextResponse.json(result, { status: 400 });
    }

    // Tìm thông tin xác thực user
    const userAuth = await prisma.userAuthentication.findFirst({
      where: { email, provider: 'local' },
      include: { user: true },
    });

    if (!userAuth || !userAuth.password_hash) {
      result = { error: 'Email hoặc mật khẩu không đúng' };
      return NextResponse.json(result, { status: 401 });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, userAuth.password_hash);
    if (!isMatch) {
      result = { error: 'Email hoặc mật khẩu không đúng' };
      return NextResponse.json(result, { status: 401 });
    }

    // Tạo refreshToken dạng JWT
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
    const refreshToken = jwt.sign(
      {
        userId: userAuth.user.id,
        email: userAuth.user.email ?? '',
        userName: userAuth.user.full_name,
        provider: 'local',
        exp: Math.floor(refreshTokenExpires.getTime() / 1000),
      },
      REFRESH_TOKEN_SECRET
    );

    // Lưu refreshToken vào DB
    await prisma.userAuthentication.update({
      where: {
        user_id_provider: {
          user_id: userAuth.user.id,
          provider: 'local',
        },
      },
      data: {
        refresh_token: refreshToken,
        last_login: new Date(),
      },
    });

    // Tạo response
    const response = NextResponse.json({
      message: 'Đăng nhập thành công',
      user: {
        id: userAuth.user.id,
        userName: userAuth.user.full_name,
        email: userAuth.user.email ?? '',
        refreshToken,
      },
    });

    // Set cookies
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 ngày
      path: '/',
    });

    response.cookies.set(
      'user',
      JSON.stringify({
        id: userAuth.user.id,
        userName: userAuth.user.full_name,
        email: userAuth.user.email ?? '',
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 ngày
        path: '/',
      }
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Lỗi server, vui lòng thử lại' }, { status: 500 });
  }
}
