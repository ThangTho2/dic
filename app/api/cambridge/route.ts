// app/api/cambridge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import clientPromise from '@/lib/mongodb';
import type { CambridgeWordData, EnhancedMeaning, Example } from '@/types/cambridge';

// Google Translate response interface
interface GoogleTranslateResponse {
  0: Array<Array<string>>;
}

// Translation API configuration
const TRANSLATION_CONFIG = {
  GOOGLE_TRANSLATE_URL:
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=',
  CAMBRIDGE_BASE_URL: 'https://dictionary.cambridge.org/dictionary/english',
};

// Enhanced rate limiting with caching
const cache = new Map<string, any>();
const rateLimiter = {
  calls: new Map<string, number[]>(),
  maxCallsPerMinute: 15, // Giảm xuống vì ít request hơn

  canMakeCall(apiName: string): boolean {
    const now = Date.now();
    const calls = this.calls.get(apiName) || [];
    const recentCalls = calls.filter(time => now - time < 60000);
    this.calls.set(apiName, recentCalls);
    return recentCalls.length < this.maxCallsPerMinute;
  },

  recordCall(apiName: string): void {
    const calls = this.calls.get(apiName) || [];
    calls.push(Date.now());
    this.calls.set(apiName, calls);
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { success: false, error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Kết nối MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('DicListWord');

    // Kiểm tra từ đã tồn tại trong database
    const existingWord = await collection.findOne({
      word: word.toLowerCase(),
    });

    if (existingWord) {
      console.log('Word found in database:', word);
      return NextResponse.json({
        success: true,
        data: existingWord.data,
        source: 'database',
      });
    }

    // Check cache
    const cacheKey = `word-${word.toLowerCase()}`;
    if (cache.has(cacheKey)) {
      console.log('Returning cached result for:', word);
      return NextResponse.json({
        success: true,
        data: cache.get(cacheKey),
        source: 'cache',
      });
    }

    // Crawl từ mới chỉ từ Cambridge
    console.log('Crawling new word from Cambridge:', word);
    const wordData = await extractWordDataFromCambridge(word);

    // Lưu vào MongoDB
    await collection.insertOne({
      word: word.toLowerCase(),
      originalWord: word,
      data: wordData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Cache kết quả (cache 30 phút)
    cache.set(cacheKey, wordData);
    setTimeout(() => cache.delete(cacheKey), 30 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: wordData,
      source: 'crawled',
    });
  } catch (error) {
    console.error('Error processing word:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Chỉ sử dụng Cambridge để crawl data
async function extractWordDataFromCambridge(word: string): Promise<CambridgeWordData> {
  console.log('🇬🇧 Processing word from Cambridge:', word);

  // Fetch Cambridge data
  const cambridgeData = await fetchCambridgeData(word);

  if (!cambridgeData) {
    throw new Error(`Word "${word}" not found in Cambridge Dictionary`);
  }

  return await processCambridgeData(word, cambridgeData);
}

// Fetch Cambridge data with enhanced error handling
async function fetchCambridgeData(word: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const url = `${TRANSLATION_CONFIG.CAMBRIDGE_BASE_URL}/${encodeURIComponent(word.trim())}`;

    console.log(`🔍 Cambridge scraping: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Cambridge HTTP error: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Enhanced word existence check
    const hasContent = $('.pr.dictionary, .entry-body, .di-title').length > 0;
    const hasError = $('.no-results, .error-page, .not-found').length > 0;

    if (!hasContent || hasError) {
      throw new Error(`Word "${word}" not found in Cambridge Dictionary`);
    }

    console.log(`✅ Cambridge success for: ${word}`);
    return $;
  } catch (error) {
    console.error(`❌ Cambridge failed for "${word}":`, error);
    return null;
  }
}

// Process Cambridge data and translate - CHỈ DỊCH QUICK TRANSLATION VÀ MEANINGS
async function processCambridgeData(
  word: string,
  cambridgeData: cheerio.CheerioAPI
): Promise<CambridgeWordData> {
  const $ = cambridgeData;

  // Extract basic data from Cambridge
  const pronunciation = extractPronunciation($);
  const partOfSpeech = extractPartOfSpeech($);
  const level = extractLevel($);
  const rawMeanings = extractMeanings($);

  // Quick translation cho từ - CHỈ DỊCH CÁI NÀY
  const quickTranslation = await getQuickTranslation(word);

  // Translate CHỈ CÁC MEANINGS (không dịch examples)
  const enhancedMeanings = await translateMeaningsOnly(rawMeanings);

  return {
    word,
    pronunciation,
    partOfSpeech,
    level,
    quickTranslation,
    meanings: enhancedMeanings,
  };
}

// Extract pronunciation from Cambridge
function extractPronunciation(cambridgeData: cheerio.CheerioAPI) {
  const $ = cambridgeData;

  const ukPron = $('.uk .pron .ipa').first().text().trim();
  const usPron = $('.us .pron .ipa').first().text().trim();

  // Extract audio URLs
  let ukAudio = $('.uk .daud audio source[type="audio/mpeg"]').attr('src') || '';
  let usAudio = $('.us .daud audio source[type="audio/mpeg"]').attr('src') || '';

  // Make audio URLs absolute
  if (ukAudio && !ukAudio.startsWith('http')) {
    ukAudio = `https://dictionary.cambridge.org${ukAudio}`;
  }
  if (usAudio && !usAudio.startsWith('http')) {
    usAudio = `https://dictionary.cambridge.org${usAudio}`;
  }

  return {
    uk: {
      ipa: ukPron || '',
      audioUrl: ukAudio,
    },
    us: {
      ipa: usPron || ukPron || '', // Fallback to UK if US not available
      audioUrl: usAudio,
    },
  };
}

// Extract part of speech from Cambridge
function extractPartOfSpeech(cambridgeData: cheerio.CheerioAPI): string {
  const $ = cambridgeData;
  return $('.pos, .dpos').first().text().trim() || '';
}

// Extract level from Cambridge
function extractLevel(cambridgeData: cheerio.CheerioAPI): string | undefined {
  const $ = cambridgeData;
  const level = $('.level, .cef-level, .level-indicator').first().text().trim();
  return level || undefined;
}

// Extract meanings from Cambridge only - GIỮ NGUYÊN EXAMPLES TIẾNG ANH
function extractMeanings(cambridgeData: cheerio.CheerioAPI): Array<any> {
  const $ = cambridgeData;
  const meanings: Array<any> = [];
  let meaningIndex = 0;

  // Cambridge structure: .entry-body .sense-body .def-block
  $('.entry-body .sense-body .def-block, .entry-body .pr.dsense .def-block')
    .slice(0, 10) // Lấy tối đa 10 nghĩa
    .each((i, defBlock) => {
      const $defBlock = $(defBlock);
      const $entry = $defBlock.closest('.entry, .pr.di');

      // Get part of speech cho nghĩa này
      const partOfSpeech = $entry.find('.pos, .dpos').first().text().trim() || '';

      // Get definition
      const definition = $defBlock.find('.def, .ddef_d').text().trim() || '';

      if (!definition) return; // Skip nếu không có definition

      const examples: string[] = [];

      // Extract examples - GIỮ NGUYÊN TIẾNG ANH, KHÔNG DỊCH
      $defBlock
        .find('.examp .eg, .dexamp .deg')
        .slice(0, 3) // Lấy tối đa 3 ví dụ
        .each((j, example) => {
          let exampleText = $(example).text().trim();

          // Clean up example text
          exampleText = exampleText.replace(/\s+/g, ' ').trim();

          if (exampleText && !exampleText.includes('→')) {
            examples.push(exampleText);
          }
        });

      meanings.push({
        id: `cambridge-${meaningIndex++}`,
        grammar: partOfSpeech,
        definition,
        examples, // CHỈ LÀ ARRAY STRING, KHÔNG PHẢI OBJECT
      });
    });

  return meanings;
}

// Quick translation cho từ - GIỮ NGUYÊN
async function getQuickTranslation(word: string): Promise<string[]> {
  try {
    if (!rateLimiter.canMakeCall('google-translate')) {
      console.warn('Rate limit exceeded for quick translation');
      return [word];
    }

    const translation = await translateText(word);
    return translation !== word ? [translation] : [word];
  } catch (error) {
    console.error('Quick translation failed:', error);
    return [word];
  }
}

// CHỈ DỊCH MEANINGS, KHÔNG DỊCH EXAMPLES
async function translateMeaningsOnly(rawMeanings: any[]): Promise<EnhancedMeaning[]> {
  const enhancedMeanings: EnhancedMeaning[] = rawMeanings.map(meaning => ({
    ...meaning,
    vietnameseDefinition: '', // Sẽ được dịch
    examples: meaning.examples.map((ex: string) => ({
      original: ex,
      vietnamese: ex, // GIỮ NGUYÊN TIẾNG ANH, KHÔNG DỊCH
    })),
  }));

  console.log(`🔄 Translating ${enhancedMeanings.length} meaning definitions only...`);

  // CHỈ TRANSLATE DEFINITION, BỎ QUA EXAMPLES
  for (let i = 0; i < enhancedMeanings.length; i++) {
    const meaning = enhancedMeanings[i];

    // CHỈ TRANSLATE DEFINITION
    if (rateLimiter.canMakeCall('google-translate')) {
      try {
        meaning.vietnameseDefinition = await translateText(meaning.definition);
        console.log(`✅ Translated definition ${i + 1}/${enhancedMeanings.length}`);
        await delay(300); // Delay 300ms
      } catch (error) {
        console.error('Definition translation failed:', error);
        meaning.vietnameseDefinition = meaning.definition;
      }
    } else {
      console.warn('Rate limit exceeded, skipping definition translation');
      meaning.vietnameseDefinition = meaning.definition;
    }

    // BỎ QUA VIỆC DỊCH EXAMPLES - ĐÃ SET SẴN VIETNAMESE = ORIGINAL Ở TRÊN
  }

  return enhancedMeanings;
}

// Google Translate function - GIỮ NGUYÊN
async function translateText(text: string): Promise<string> {
  if (!rateLimiter.canMakeCall('google-translate')) {
    throw new Error('Google Translate rate limit exceeded');
  }

  try {
    const response = await fetch(
      `${TRANSLATION_CONFIG.GOOGLE_TRANSLATE_URL}${encodeURIComponent(text)}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    rateLimiter.recordCall('google-translate');
    const data = (await response.json()) as GoogleTranslateResponse;

    if (data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return text;
  } catch (error) {
    console.error('Google translation failed:', error);
    return text;
  }
}

// Utility delay function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
