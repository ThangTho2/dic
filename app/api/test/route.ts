
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  await redis.set(`otp:${email}`, password, { ex: 300 }); // TTL 5 phút

  return Response.json({ ok: true, message: 'OTP stored' });
}
