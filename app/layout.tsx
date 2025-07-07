// File này là layout chính của app, thêm Header vào đây
import { ModeToggle } from '@/components/modeToggle';
import { ThemeProvider } from '@/components/themeProvider';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './context/providers';
import { AuthGuard } from '@/components/auth/AuthGuard';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Word list',
  description: 'Create a word list with Next.js and Tailwind CSS',
};

// @ts-ignore
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className="min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="fixed top-4 right-4 z-50">
              <ModeToggle />
            </div>
            <Providers>
              <AuthGuard>
                <Header />
                <div className="min-h-screen">{children}</div>
              </AuthGuard>
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
