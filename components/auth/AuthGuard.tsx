'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface User {
  id: number;
  userName: string;
  email: string;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));

        if (userCookie) {
          const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        document.cookie = 'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname.startsWith('/auth/');

    // Nếu đã đăng nhập và đang ở trang auth -> chuyển về home
    if (user && isAuthPage) {
      router.replace('/');
      return;
    }

    // Nếu chưa đăng nhập và KHÔNG ở trang auth -> chuyển về login
    if (!user && !isAuthPage) {
      router.replace('/auth/login');
      return;
    }
  }, [user, pathname, isLoading, router]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
