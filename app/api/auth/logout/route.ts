// File này là API route để xử lý đăng xuất người dùng
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

export async function POST(req: NextRequest) {
  try {
    // Lấy refreshToken từ cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      try {
        // Decode JWT để lấy userId
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;

        // Xóa refreshToken từ database
        await prisma.userAuthentication.updateMany({
          where: {
            user_id: decoded.userId,
            provider: 'local',
          },
          data: {
            refresh_token: null,
          },
        });
      } catch (jwtError) {
        // Token không hợp lệ, bỏ qua và tiếp tục xóa cookies
        console.log('Invalid token during logout:', jwtError);
      }
    }

    // Tạo response
    const response = NextResponse.json({
      message: 'Đăng xuất thành công',
    });

    // Xóa cookies
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    response.cookies.set('user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Lỗi server khi đăng xuất' }, { status: 500 });
  }
}
