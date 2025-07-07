// app/api/addword/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log('🚀 /api/addword called');

  try {
    // Lấy userId từ header do middleware gắn vào
    const userId = Number(request.headers.get('x-user-id'));
    console.log(request.headers.get('x-user-id'));

    const userEmail = request.headers.get('x-user-email');

    console.log('👤 User from middleware:', { userId, userEmail });
    console.log('userId', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Request body received for user:', userId);

    // Validate request body
    if (!body.wordData || !body.meaningId) {
      return NextResponse.json(
        { success: false, error: 'Missing wordData or meaningId' },
        { status: 400 }
      );
    }

    const { wordData, meaningId } = body;

    // Validate wordData structure
    if (!wordData.word || !wordData.meanings || !Array.isArray(wordData.meanings)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wordData structure' },
        { status: 400 }
      );
    }

    // Tìm meaning được chọn
    const selectedMeaning = wordData.meanings.find((m: any) => m.id === meaningId);
    if (!selectedMeaning) {
      return NextResponse.json(
        { success: false, error: 'Selected meaning not found' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async tx => {
      let wordId: number;
      let meaningDbId: number | undefined;
      let action = '';

      // 1. Kiểm tra từ đã tồn tại chưa
      let existingWord = await tx.word.findUnique({
        where: { word: wordData.word },
        include: {
          meanings: {
            where: { meaning_id: meaningId },
          },
        },
      });

      if (!existingWord) {
        // 2a. Từ chưa tồn tại -> Tạo mới word
        console.log(`🆕 Creating new word: ${wordData.word}`);

        const newWord = await tx.word.create({
          data: {
            word: wordData.word,
            part_of_speech: wordData.partOfSpeech,
            // level: wordData.level,
            uk_ipa: wordData.pronunciation?.uk?.ipa,
            uk_audio_url: wordData.pronunciation?.uk?.audioUrl,
            us_ipa: wordData.pronunciation?.us?.ipa,
            us_audio_url: wordData.pronunciation?.us?.audioUrl,
            quick_translations: wordData.quickTranslation || [],
          },
        });

        wordId = newWord.id;
        action = 'created_word_and_meaning';
      } else {
        // 2b. Từ đã tồn tại
        wordId = existingWord.id;

        if (existingWord.meanings.length > 0) {
          // Meaning đã tồn tại trong từ điển
          meaningDbId = existingWord.meanings[0].id;
          action = 'word_exists';
        } else {
          // Từ có nhưng nghĩa này chưa có
          action = 'added_meaning';
        }

        // Cập nhật thông tin word (pronunciation có thể thay đổi)
        await tx.word.update({
          where: { id: wordId },
          data: {
            part_of_speech: wordData.partOfSpeech,
            // level: wordData.level,
            uk_ipa: wordData.pronunciation?.uk?.ipa,
            uk_audio_url: wordData.pronunciation?.uk?.audioUrl,
            us_ipa: wordData.pronunciation?.us?.ipa,
            us_audio_url: wordData.pronunciation?.us?.audioUrl,
            quick_translations: wordData.quickTranslation || [],
            updated_at: new Date(),
          },
        });
      }

      // 3. Thêm meaning mới nếu chưa có
      if (action !== 'word_exists') {
        const newMeaning = await tx.wordMeaning.create({
          data: {
            word_id: wordId,
            meaning_id: meaningId,
            definition: selectedMeaning.definition,
            vietnamese_definition: selectedMeaning.vietnameseDefinition,
            grammar: selectedMeaning.grammar,
            meaning_level: selectedMeaning.level,
            examples: selectedMeaning.examples || [],
            thesaurus: selectedMeaning.thesaurus || null,
            display_order: await getNextDisplayOrder(tx, wordId),
            source: 'cambridge',
            contributor_user_id: userId,
          },
        });

        meaningDbId = newMeaning.id;
        console.log(`✅ Created meaning with ID: ${meaningDbId}`);
      }

      // 4. Kiểm tra user đã có nghĩa này trong danh sách ôn tập chưa
      const existingLearningItem = await tx.userLearningItem.findUnique({
        where: {
          unique_user_meaning: {
            user_id: userId,
            meaning_id: meaningDbId!,
          },
        },
      });

      if (existingLearningItem) {
        // User đã có nghĩa này trong danh sách ôn tập
        return {
          success: false,
          error: 'Nghĩa này đã có trong danh sách ôn tập của bạn rồi',
          data: {
            wordId,
            meaningId: meaningDbId,
            action: 'already_in_learning_list',
          },
        };
      }

      // 5. Thêm vào danh sách ôn tập của user
      const learningItem = await tx.userLearningItem.create({
        data: {
          user_id: userId,
          meaning_id: meaningDbId!,
          confidence_level: 0,
          study_status: 'new',
          priority: 5,
          is_favorite: false,
          next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Review sau 1 ngày
        },
      });

      console.log(`✅ Added to learning list with ID: ${learningItem.id}`);

      // Cập nhật action cuối cùng
      if (action === 'word_exists') {
        action = 'added_to_learning';
      }

      return {
        success: true,
        data: {
          wordId,
          meaningId: meaningDbId,
          learningItemId: learningItem.id,
          word: wordData.word,
          action,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error adding word to dictionary:', error);

    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nghĩa này đã có trong danh sách ôn tập của bạn rồi',
        },
        { status: 409 }
      );
    }

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

// Helper function để lấy display_order tiếp theo
async function getNextDisplayOrder(tx: any, wordId: number): Promise<number> {
  const lastMeaning = await tx.wordMeaning.findFirst({
    where: { word_id: wordId },
    orderBy: { display_order: 'desc' },
  });

  return lastMeaning ? lastMeaning.display_order + 1 : 0;
}

// GET route để test
export async function GET() {
  try {
    const wordsCount = await prisma.word.count();
    const meaningsCount = await prisma.wordMeaning.count();
    const learningItemsCount = await prisma.userLearningItem.count();

    return NextResponse.json({
      success: true,
      stats: {
        words: wordsCount,
        meanings: meaningsCount,
        learningItems: learningItemsCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get stats' }, { status: 500 });
  }
}
