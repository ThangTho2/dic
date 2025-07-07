'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN'));

      const hour = now.getHours();
      if (hour < 12) setGreeting('Chào buổi sáng');
      else if (hour < 18) setGreeting('Chào buổi chiều');
      else setGreeting('Chào buổi tối');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navigationCards = [
    {
      title: 'Thêm từ mới',
      description: 'Thêm từ vựng mới vào từ điển cá nhân',
      icon: '📝',
      href: '/add-word',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-zinc-800',
    },
    {
      title: 'Danh sách từ',
      description: 'Xem tất cả từ vựng đã lưu',
      icon: '📚',
      href: '/word-list',
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50 dark:bg-zinc-800',
    },
    {
      title: 'Luyện tập',
      description: 'Ôn tập từ vựng với flashcards',
      icon: '🎯',
      href: '/practice',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-zinc-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-3xl">📚</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              English Dictionary
            </h1>
            <p className="text-lg text-gray-600 dark:text-zinc-300 mb-4">
              Ứng dụng học từ vựng thông minh và hiệu quả
            </p>
          </div>

          {/* Time and Greeting */}
          <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50 dark:border-zinc-700/50 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-zinc-200 mb-1">
                  {greeting}! 👋
                </h2>
                <p className="text-gray-600 dark:text-zinc-400">
                  Hôm nay là ngày tuyệt vời để học từ vựng mới
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {currentTime}
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  {new Date().toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-200 mb-6 text-center">
            Chức năng chính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {navigationCards.map((card, index) => (
              <div
                key={index}
                onClick={() => router.push(card.href)}
                className={`${card.bgColor} rounded-2xl p-6 border border-gray-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 group`}
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-zinc-200 mb-1">
                      {card.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  Bắt đầu <span className="ml-1">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Quote */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white text-center shadow-xl mb-12">
          <div className="text-6xl mb-4">💡</div>
          <blockquote className="text-xl font-medium mb-4 italic">
            "Learning never exhausts the mind."
          </blockquote>
          <p className="text-indigo-200">- Leonardo da Vinci</p>
        </div>

      </div>
    </div>
  );
}
