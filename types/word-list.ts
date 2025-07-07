// types/word-list.ts
export interface UserWordItem {
  // Learning item info
  learningItemId: number;
  addedAt: string;
  studyStatus: 'new' | 'learning' | 'reviewing' | 'mastered';
  confidenceLevel: number;
  timesStudied: number;
  timesCorrect: number;
  timesWrong: number;
  streakCount: number;
  lastStudiedAt: string | null;
  nextReviewAt: string | null;
  priority: number;
  isFavorite: boolean;
  notes: string | null;

  // Word info
  word: {
    id: number;
    word: string;
    partOfSpeech: string | null;
    ukIpa: string | null;
    ukAudioUrl: string | null;
    usIpa: string | null;
    usAudioUrl: string | null;
    quickTranslations: any;
    createdAt: string;
    updatedAt: string;
  };

  // Meaning info
  meaning: {
    id: number;
    meaningId: string;
    definition: string;
    vietnameseDefinition: string;
    grammar: string | null;
    meaningLevel: string | null;
    examples: any;
    thesaurus: any;
    displayOrder: number;
    source: 'cambridge' | 'freedict' | 'user';
    createdAt: string;
  };
}

export interface WordListResponse {
  success: boolean;
  data: {
    words: UserWordItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  error?: string;
}
