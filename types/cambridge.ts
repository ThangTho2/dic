export interface CambridgeWordData {
  word: string;
  pronunciation: {
    uk: {
      ipa: string;
      audioUrl: string;
    };
    us: {
      ipa: string;
      audioUrl: string;
    };
  };
  partOfSpeech: string;
  level?: string;
  quickTranslation: string[];
  meanings: EnhancedMeaning[];
}

export interface EnhancedMeaning {
  id: string;
  level?: string;
  grammar?: string;
  definition: string;
  vietnameseDefinition: string;
  examples: Example[];
  thesaurus?: {
    synonyms: string[];
    antonyms: string[];
  };
}

export interface Example {
  original: string;
  vietnamese: string;
}

export interface CrawlResponse {
  success: boolean;
  data?: CambridgeWordData;
  error?: string;
}
