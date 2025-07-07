'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Chrome, Lock, Mail, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: number;
    userName: string;
    email: string;
    refreshToken: string;
  };
  error?: string;
}

const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  const response = await axios.post('/api/auth/login', data);
  return response.data;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const searchParams = useSearchParams();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: data => {
      setNotification({
        type: 'success',
        message: 'Đăng nhập thành công! Đang chuyển hướng...',
      });

      // AuthGuard sẽ tự động redirect
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi đăng nhập';
      setNotification({
        type: 'error',
        message: errorMessage,
      });
    },
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      switch (success) {
        case 'account_created_successfully':
          setNotification({
            type: 'success',
            message: 'Tài khoản đã được tạo thành công! Bạn có thể đăng nhập ngay bây giờ.',
          });
          break;
        default:
          setNotification({
            type: 'success',
            message: 'Thao tác thành công!',
          });
      }
    }

    if (error) {
      switch (error) {
        case 'invalid_or_expired_token':
          setNotification({
            type: 'error',
            message: 'Link xác nhận đã hết hạn. Vui lòng đăng ký lại.',
          });
          break;
        case 'email_already_exists':
          setNotification({
            type: 'warning',
            message: 'Email này đã được đăng ký. Bạn có thể đăng nhập trực tiếp.',
          });
          break;
        case 'registration_failed':
          setNotification({
            type: 'error',
            message: 'Có lỗi xảy ra. Vui lòng thử đăng ký lại.',
          });
          break;
        default:
          setNotification({
            type: 'error',
            message: 'Có lỗi xảy ra. Vui lòng thử lại.',
          });
      }
    }

    if (success || error) {
      const timer = setTimeout(() => {
        setNotification(null);
        window.history.replaceState({}, '', '/auth/login');
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setNotification({
        type: 'error',
        message: 'Vui lòng nhập đầy đủ email và mật khẩu',
      });
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-white dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Notification */}
        {notification && (
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${getNotificationStyle(
              notification.type
            )}`}
          >
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Login Card */}
        <Card className="shadow-2xl border border-green-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
              Đăng Nhập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-green-700 dark:text-green-400 font-medium mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-green-500 dark:text-green-400" />
                  <Input
                    type="email"
                    placeholder="Nhập email của bạn"
                    autoComplete="email"
                    className="pl-10 border-green-200 dark:border-zinc-800 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 bg-green-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              <div>
                <label className="block text-green-700 dark:text-green-400 font-medium mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-green-500 dark:text-green-400" />
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="pl-10 border-green-200 dark:border-zinc-800 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 bg-green-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng Nhập'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-green-600/70 dark:text-green-400/70">
              Chưa có tài khoản?{' '}
              <a
                href="/auth/register"
                className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium hover:underline"
              >
                Đăng ký ngay
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
