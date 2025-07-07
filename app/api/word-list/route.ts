// app/api/word-list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  console.log('🚀 /api/word-list called');

  try {
    // Lấy userId từ header do middleware gắn vào
    const userId = Number(request.headers.get('x-user-id'));
    const userEmail = request.headers.get('x-user-email');

    console.log('👤 User from middleware:', { userId, userEmail });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Lấy query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('📄 Pagination:', { page, limit, offset });

    // Lấy danh sách từ với pagination
    const [userWords, totalCount] = await Promise.all([
      prisma.userLearningItem.findMany({
        where: {
          user_id: userId,
        },
        include: {
          meaning: {
            include: {
              word: true,
            },
          },
        },
        orderBy: {
          added_at: 'desc', // Mới nhất trước
        },
        skip: offset,
        take: limit,
      }),

      // Đếm tổng số từ
      prisma.userLearningItem.count({
        where: {
          user_id: userId,
        },
      }),
    ]);

    console.log(`✅ Found ${userWords.length} words for user ${userId}`);

    // Format dữ liệu trả về
    const formattedWords = userWords.map(item => ({
      // Learning item info
      learningItemId: item.id,
      addedAt: item.added_at,
      studyStatus: item.study_status,
      confidenceLevel: item.confidence_level,
      timesStudied: item.times_studied,
      timesCorrect: item.times_correct,
      timesWrong: item.times_wrong,
      streakCount: item.streak_count,
      lastStudiedAt: item.last_studied_at,
      nextReviewAt: item.next_review_at,
      priority: item.priority,
      isFavorite: item.is_favorite,
      notes: item.notes,

      // Word info
      word: {
        id: item.meaning.word.id,
        word: item.meaning.word.word,
        partOfSpeech: item.meaning.word.part_of_speech,
        ukIpa: item.meaning.word.uk_ipa,
        ukAudioUrl: item.meaning.word.uk_audio_url,
        usIpa: item.meaning.word.us_ipa,
        usAudioUrl: item.meaning.word.us_audio_url,
        quickTranslations: item.meaning.word.quick_translations,
        createdAt: item.meaning.word.created_at,
        updatedAt: item.meaning.word.updated_at,
      },

      // Meaning info
      meaning: {
        id: item.meaning.id,
        meaningId: item.meaning.meaning_id,
        definition: item.meaning.definition,
        vietnameseDefinition: item.meaning.vietnamese_definition,
        grammar: item.meaning.grammar,
        meaningLevel: item.meaning.meaning_level,
        examples: item.meaning.examples,
        thesaurus: item.meaning.thesaurus,
        displayOrder: item.meaning.display_order,
        source: item.meaning.source,
        createdAt: item.meaning.created_at,
      },
    }));

    // Pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        words: formattedWords,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error fetching word list:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
