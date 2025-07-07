import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import bcrypt from 'bcrypt';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?error=missing_token', req.url));
    }

    // Lấy thông tin đăng ký từ Redis
    const data = await redis.get(`register:${token}`);
    console.log('Data from Redis:', data); // Debug log

    if (!data) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid_or_expired_token', req.url));
    }

    // Xử lý JSON parse an toàn hơn
    let parsedData;
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      if (!jsonString || jsonString.trim() === '') {
        throw new Error('Empty data');
      }
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      await redis.del(`register:${token}`);
      return NextResponse.redirect(new URL('/auth/login?error=invalid_data', req.url));
    }

    const { email, fullName, phone, birthday, password } = parsedData;

    // Validate required fields
    if (!email || !fullName || !password) {
      await redis.del(`register:${token}`);
      return NextResponse.redirect(new URL('/auth/login?error=missing_data', req.url));
    }

    // Kiểm tra lại email chưa tồn tại (double check)
    const userExists = await prisma.user.findUnique({ where: { email } });
    const userAuthExists = await prisma.userAuthentication.findFirst({ where: { email } });

    if (userExists || userAuthExists) {
      await redis.del(`register:${token}`);
      return NextResponse.redirect(new URL('/auth/login?error=email_already_exists', req.url));
    }

    // Tạo user mới
    const user = await prisma.user.create({
      data: {
        full_name: fullName,
        email,
        phone: phone || null,
      },
    });

    // Tạo UserAuthentication
    await prisma.userAuthentication.create({
      data: {
        user_id: user.id,
        provider: 'local',
        email,
        password_hash: await bcrypt.hash(password, 10),
      },
    });

    // Xóa token khỏi Redis sau khi tạo thành công
    await redis.del(`register:${token}`);

    // Chuyển hướng về trang đăng nhập với thông báo thành công
    return NextResponse.redirect(
      new URL('/auth/login?success=account_created_successfully', req.url)
    );
  } catch (error) {
    console.error('Error verifying registration:', error);

    // Nếu có token, thử xóa nó để tránh trạng thái không nhất quán
    const token = req.nextUrl.searchParams.get('token');
    if (token) {
      try {
        await redis.del(`register:${token}`);
      } catch (redisError) {
        console.error('Error cleaning up Redis token:', redisError);
      }
    }

    return NextResponse.redirect(new URL('/auth/login?error=registration_failed', req.url));
  }
}
