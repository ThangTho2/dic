// app/add-word/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CambridgeWordData, CrawlResponse } from '@/types/cambridge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, ArrowLeft, Plus, Search, Eye } from 'lucide-react';
import api from '@/lib/axios';

export default function AddWordPage() {
  const router = useRouter();
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [wordData, setWordData] = useState<CambridgeWordData | null>(null);
  const [error, setError] = useState('');

  const ukAudioRef = useRef<HTMLAudioElement>(null);
  const usAudioRef = useRef<HTMLAudioElement>(null);

  const handleSearch = async () => {
    if (!word.trim()) {
      setError('Vui lòng nhập từ cần tra cứu');
      return;
    }

    setLoading(true);
    setError('');
    setWordData(null);

    try {
      const response = await fetch(`/api/cambridge?word=${encodeURIComponent(word.trim())}`);
      const result: CrawlResponse = await response.json();

      if (result.success && result.data) {
        setWordData(result.data);
      } else {
        setError(result.error || 'Không tìm thấy từ này');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tra cứu từ');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (type: 'uk' | 'us') => {
    const audioRef = type === 'uk' ? ukAudioRef : usAudioRef;
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddMeaning = async (meaning: any) => {
    if (!wordData) return;

    try {
      setLoading(true);

      const response = await api.post('/api/addword', {
        wordData,
        meaningId: meaning.id,
      });

      const result = response.data;

      if (result.success) {
        console.log('✅ Success:', result.data);
        setError('');
      } else {
        console.error('❌ Failed:', result.error);

        if (result.error.includes('already exist')) {
          setError('Nghĩa này đã có trong danh sách ôn tập của bạn rồi!');
        } else {
          setError(result.error || 'Có lỗi xảy ra khi thêm vào từ điển');
        }
      }
    } catch (error: any) {
      console.error('❌ Network error:', error);

      if (error.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      } else {
        setError('Lỗi kết nối, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-2 py-3 max-w-4xl">
        {/* Header - Compact */}
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="mb-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 h-8 px-2 text-sm"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Trang chủ
          </Button>

          <h1 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100 mb-1">
            Tra cứu từ vựng
          </h1>
        </div>

        {/* Search Form - Compact */}
        <Card className="mb-3 shadow-sm">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  value={word}
                  onChange={e => setWord(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập từ tiếng Anh..."
                  disabled={loading}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                size="sm"
                className="h-9 px-4 text-sm"
              >
                {loading ? (
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Tra cứu'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error - Compact */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Word Data - Ultra Compact */}
        {wordData && (
          <Card className="shadow-sm">
            <CardContent className="p-3 space-y-2">
              {/* Word Header - 1 Line */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {wordData.word}
                  </h2>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {wordData.partOfSpeech}
                  </Badge>
                  {wordData.level && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 border-blue-300 text-blue-700"
                    >
                      {wordData.level}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Pronunciation + Quick Translation - 1 Line */}
              <div className="flex items-center justify-between gap-4 text-sm">
                {/* Pronunciation */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600 font-mono text-sm">
                      UK: {wordData.pronunciation.uk.ipa}
                    </span>
                    {wordData.pronunciation.uk.audioUrl && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playAudio('uk')}
                          className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                        <audio
                          ref={ukAudioRef}
                          src={wordData.pronunciation.uk.audioUrl}
                          preload="metadata"
                        />
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-red-600 font-mono text-sm">
                      US: {wordData.pronunciation.us.ipa}
                    </span>
                    {wordData.pronunciation.us.audioUrl && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playAudio('us')}
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                        <audio
                          ref={usAudioRef}
                          src={wordData.pronunciation.us.audioUrl}
                          preload="metadata"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Translation */}
                <div className="text-sm text-slate-600 dark:text-slate-400 italic">
                  {wordData.quickTranslation.join(', ')}
                </div>
              </div>

              {/* Meanings - Ultra Compact */}
              <div className="space-y-1 pt-2 border-t">
                {wordData.meanings.map((meaning, index) => (
                  <div
                    key={meaning.id}
                    className="group bg-slate-50 dark:bg-slate-800/50 rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {/* Meaning Header - 1 Line */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="bg-slate-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        {meaning.grammar && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 border-emerald-300 text-emerald-700"
                          >
                            {meaning.grammar}
                          </Badge>
                        )}
                        {meaning.level && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 border-purple-300 text-purple-700"
                          >
                            {meaning.level}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMeaning(meaning)}
                        disabled={loading}
                        className="h-6 px-2 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {loading ? 'Thêm...' : 'Thêm'}
                      </Button>
                    </div>

                    {/* English Definition */}
                    <p className="text-sm text-slate-800 dark:text-slate-200 mb-1 leading-relaxed">
                      {meaning.definition}
                    </p>

                    {/* Vietnamese Definition - Hover */}
                    <div className="group/def relative cursor-pointer mb-1">
                      <div className="group-hover/def:opacity-0 transition-opacity duration-200 flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover/def:opacity-100 transition-opacity duration-200">
                        <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                          {meaning.vietnameseDefinition}
                        </p>
                      </div>
                    </div>

                    {/* Examples - NO TRANSLATION, ENGLISH ONLY */}
                    {meaning.examples && meaning.examples.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div className="space-y-1">
                          {meaning.examples.slice(0, 2).map((example, exIndex) => (
                            <div key={exIndex} className="text-xs">
                              <p className="text-amber-800 dark:text-amber-200">
                                <em>
                                  "{typeof example === 'string' ? example : example.original}"
                                </em>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thesaurus - Inline */}
                    {meaning.thesaurus &&
                      (meaning.thesaurus.synonyms?.length > 0 ||
                        meaning.thesaurus.antonyms?.length > 0) && (
                        <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                          {meaning.thesaurus.synonyms?.length > 0 && (
                            <div className="mb-1">
                              <span className="text-green-700 dark:text-green-300 font-medium mr-1">
                                Đồng nghĩa:
                              </span>
                              <span className="text-green-600 dark:text-green-400">
                                {meaning.thesaurus.synonyms.slice(0, 3).join(', ')}
                              </span>
                            </div>
                          )}
                          {meaning.thesaurus.antonyms?.length > 0 && (
                            <div>
                              <span className="text-red-700 dark:text-red-300 font-medium mr-1">
                                Trái nghĩa:
                              </span>
                              <span className="text-red-600 dark:text-red-400">
                                {meaning.thesaurus.antonyms.slice(0, 3).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
