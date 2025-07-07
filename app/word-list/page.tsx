// app/word-list/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { UserWordItem, WordListResponse } from '@/types/word-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Volume2,
  Book,
  Calendar,
  Target,
  Clock,
  Heart,
  BarChart3,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/axios';

export default function WordListPage() {
  const router = useRouter();
  const [words, setWords] = useState<UserWordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch words
  const fetchWords = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<WordListResponse>(`/api/word-list?page=${page}&limit=20`);

      if (response.data.success) {
        setWords(response.data.data.words);
        setPagination(response.data.data.pagination);
      } else {
        setError(response.data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      console.error('Error fetching words:', err);
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      } else {
        setError('Có lỗi xảy ra khi tải danh sách từ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // Play audio
  const playAudio = (audioUrl: string) => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'learning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'reviewing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Mới';
      case 'learning':
        return 'Đang học';
      case 'reviewing':
        return 'Ôn tập';
      case 'mastered':
        return 'Đã thuộc';
      default:
        return status;
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWords(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Từ vựng của tôi
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Tổng cộng {pagination.totalCount} từ trong bộ sưu tập
              </p>
            </div>

            <Button
              onClick={() => fetchWords(pagination.currentPage)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Đang tải danh sách từ...</p>
            </CardContent>
          </Card>
        )}

        {/* Word List */}
        {!loading && words.length > 0 && (
          <div className="space-y-4">
            {words.map(item => (
              <Card key={item.learningItemId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Word Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {item.word.word}
                        </h3>

                        {item.word.partOfSpeech && (
                          <Badge variant="secondary" className="text-xs">
                            {item.word.partOfSpeech}
                          </Badge>
                        )}

                        <Badge className={`text-xs ${getStatusColor(item.studyStatus)}`}>
                          {getStatusText(item.studyStatus)}
                        </Badge>

                        {item.isFavorite && <Heart className="w-4 h-4 text-red-500 fill-current" />}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.addedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {/* Pronunciation */}
                    <div className="flex items-center gap-4 text-sm">
                      {item.word.ukIpa && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600 font-mono">UK: {item.word.ukIpa}</span>
                          {item.word.ukAudioUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playAudio(item.word.ukAudioUrl!)}
                              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}

                      {item.word.usIpa && (
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 font-mono">US: {item.word.usIpa}</span>
                          {item.word.usAudioUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playAudio(item.word.usAudioUrl!)}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Translation */}
                    {item.word.quickTranslations && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 italic">
                        {Array.isArray(item.word.quickTranslations)
                          ? item.word.quickTranslations.join(', ')
                          : item.word.quickTranslations}
                      </div>
                    )}

                    {/* Definition */}
                    <div className="space-y-2">
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        {item.meaning.definition}
                      </p>

                      {/* Vietnamese Definition - Hover */}
                      <div className="group/def relative cursor-pointer">
                        <div className="group-hover/def:opacity-0 transition-opacity duration-200 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600">Nghĩa tiếng Việt</span>
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover/def:opacity-100 transition-opacity duration-200">
                          <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                            {item.meaning.vietnameseDefinition}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Examples */}
                    {item.meaning.examples &&
                      Array.isArray(item.meaning.examples) &&
                      item.meaning.examples.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="space-y-1">
                            {item.meaning.examples.slice(0, 2).map((example: any, idx: number) => (
                              <p key={idx} className="text-xs text-amber-800 dark:text-amber-200">
                                <em>
                                  "{typeof example === 'string' ? example : example.original}"
                                </em>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>Học {item.timesStudied} lần</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>
                          Đúng {item.timesCorrect}/{item.timesStudied}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Streak: {item.streakCount}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>Độ tin tưởng: {item.confidenceLevel}/10</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && words.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Book className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Chưa có từ vựng nào
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Hãy bắt đầu thêm từ vựng vào bộ sưu tập của bạn
              </p>
              <Button
                onClick={() => router.push('/add-word')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Book className="w-4 h-4 mr-2" />
                Thêm từ vựng
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!loading && words.length > 0 && pagination.totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Trang {pagination.currentPage} / {pagination.totalPages} ({pagination.totalCount}{' '}
                  từ)
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio element */}
        <audio ref={audioRef} preload="metadata" />
      </div>
    </div>
  );
}
