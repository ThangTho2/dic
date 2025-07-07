import { NextRequest, NextResponse } from 'next/server';
import type { CheckRegisterResponse } from '@/types/auth';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { transporter } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, phone, birthday, password } = await req.json();
    let result: CheckRegisterResponse;

    // Kiểm tra email đã tồn tại chưa
    const user = await prisma.user.findUnique({ where: { email } });
    const userAuth = await prisma.userAuthentication.findFirst({ where: { email } });

    if (user || userAuth) {
      result = {
        error: 'Email already exists',
        canRegister: false,
      };
      return NextResponse.json(result, { status: 400 });
    }

    // Sinh token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');

    // Lưu thông tin vào Redis với TTL 10 phút (600 giây)
    await redis.set(
      `register:${token}`,
      JSON.stringify({ email, fullName, phone, birthday, password }),
      { ex: 600 }
    );

    // Tạo URL xác nhận - sử dụng đúng endpoint verify
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register/verify?token=${token}`;

    // Gửi email xác nhận với giao diện đẹp
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận đăng ký tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f6f8fa; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px;">
            <h2 style="color: #16a34a; text-align: center; margin-bottom: 16px;">Xác nhận đăng ký tài khoản</h2>
            <p>Xin chào <b>${fullName}</b>,</p>
            <p>Bạn vừa đăng ký tài khoản tại hệ thống. Vui lòng nhấn vào nút bên dưới để xác nhận và tạo tài khoản.<br>
            <span style="color: #888;">(Liên kết có hiệu lực trong 10 phút)</span></p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(90deg,#16a34a,#059669); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                Tạo tài khoản
              </a>
            </div>
            <p style="font-size: 13px; color: #666; text-align: center;">
              Nếu nút không hoạt động, hãy copy và dán liên kết sau vào trình duyệt:<br>
              <a href="${verifyUrl}" style="color: #059669;">${verifyUrl}</a>
            </p>
            <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.
            </p>
          </div>
        </div>
      `,
    });

    result = {
      message:
        'Can register with this email',
      canRegister: true,
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in register check:', error);
    return NextResponse.json(
      { error: 'Internal server error', canRegister: false },
      { status: 500 }
    );
  }
}
