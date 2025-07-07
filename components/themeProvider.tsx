'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Lấy theme từ localStorage trước khi render
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedTheme);
      }
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    // Có thể trả về null hoặc một splash/loading nhỏ
    return null;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
