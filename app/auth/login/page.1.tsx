'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Chrome, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý đăng nhập ở đây
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-white dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-green-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-sm">
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
                  autoComplete="off"
                  className="pl-10 border-green-200 dark:border-zinc-800 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 bg-green-50/50 dark:bg-zinc-950 text-zinc-100 dark:text-zinc-100 placeholder:text-zinc-400"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  autoComplete="off"
                  className="pl-10 border-green-200 dark:border-zinc-800 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 bg-green-50/50 dark:bg-zinc-950 text-zinc-100 dark:text-zinc-100 placeholder:text-zinc-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Đăng Nhập
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-green-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-green-600/70 dark:text-green-400/70">
                Hoặc
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full border-green-200 dark:border-zinc-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-zinc-800 hover:text-green-800 dark:hover:text-green-300 hover:border-green-300 dark:hover:border-zinc-600 transition-all duration-200 bg-white dark:bg-zinc-900"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Đăng nhập với Google
          </Button>
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
  );
}
