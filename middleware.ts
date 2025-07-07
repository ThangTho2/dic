// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyRefreshToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware for:', request.nextUrl.pathname);

  const { pathname } = request.nextUrl;

  // Bỏ qua các route public
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    console.log('⭐ Skipping auth for public route');
    return NextResponse.next();
  }

  // Lấy refreshToken từ cookies
  const refreshToken = request.cookies.get('refreshToken')?.value;
  console.log('🍪 RefreshToken exists:', !!refreshToken);

  if (!refreshToken) {
    console.log('❌ No refresh token found');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized - No token',
      },
      { status: 401 }
    );
  }

  // Giải mã JWT để lấy user info
  console.log('🔑 Verifying and decoding JWT...');
  const user = await verifyRefreshToken(refreshToken);

  if (!user) {
    console.log('❌ Invalid or expired token');
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized - Invalid token',
      },
      { status: 401 }
    );
  }

  console.log('✅ User authenticated:', {
    id: user.id,
    email: user.email,
    userName: user.userName,
  });

  // ✅ CÁCH ĐÚNG: Clone request headers và thêm user info
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id.toString());
  requestHeaders.set('x-user-email', user.email);

  console.log('✅ Setting headers:', {
    'x-user-id': user.id.toString(),
    'x-user-email': user.email,
  });

  // ✅ QUAN TRỌNG: Pass headers qua NextResponse.next()
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  console.log('✅ Middleware completed - headers added to response');
  return response;
}

export const config = {
  matcher: ['/api/addword', '/api/word-list'], 
};
