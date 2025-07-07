'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, User, Phone, Calendar, Lock, Chrome } from 'lucide-react';

const fields = [
  { label: 'Email', name: 'email', type: 'email', placeholder: 'Nhập email của bạn', icon: Mail },
  {
    label: 'Họ tên',
    name: 'fullName',
    type: 'text',
    placeholder: 'Nhập họ tên của bạn',
    icon: User,
  },
  {
    label: 'Số điện thoại',
    name: 'phone',
    type: 'text',
    placeholder: 'Nhập số điện thoại của bạn',
    icon: Phone,
  },
  { label: 'Ngày sinh', name: 'birthday', type: 'date', placeholder: '', icon: Calendar },
  {
    label: 'Mật khẩu',
    name: 'password',
    type: 'password',
    placeholder: 'Nhập mật khẩu của bạn',
    icon: Lock,
  },
  {
    label: 'Nhập lại mật khẩu',
    name: 'confirmPassword',
    type: 'password',
    placeholder: 'Nhập lại mật khẩu của bạn',
    icon: Lock,
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    birthday: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý đăng ký ở đây
    console.log('Register attempt:', form);
  };

  const handleGoogleRegister = () => {
    // Điều hướng sang endpoint đăng ký với Google
    window.location.href = '/auth/google';
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-white dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-green-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
            Đăng ký
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-green-700 dark:text-green-400 font-medium mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  {field.icon && (
                    <field.icon className="absolute left-3 top-3 h-4 w-4 text-green-500 dark:text-green-400" />
                  )}
                  <Input
                    type={field.type}
                    name={field.name}
                    placeholder={field.type === 'date' ? undefined : field.placeholder}
                    className={
                      'pl-10 border-green-200 dark:border-zinc-800 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 dark:focus:ring-green-400/20 bg-green-50/50 dark:bg-zinc-950 ' +
                      (field.type === 'date'
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-100 dark:text-zinc-100 placeholder:text-zinc-400')
                    }
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange}
                  />
                </div>
              </div>
            ))}
            <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl">
              Đăng ký
            </Button>
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
              onClick={handleGoogleRegister}
              className="w-full border-green-200 dark:border-zinc-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-zinc-800 hover:text-green-800 dark:hover:text-green-300 hover:border-green-300 dark:hover:border-zinc-600 transition-all duration-200 bg-white dark:bg-zinc-900"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Đăng ký với Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-green-600/70 dark:text-green-400/70">
            Đã có tài khoản?{' '}
            <a
              href="/auth/login"
              className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium hover:underline"
            >
              Đăng nhập ngay
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
