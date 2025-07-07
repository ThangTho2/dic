-- Bảng từ vựng chính - CHỈ lưu thông tin CHUNG của từ
CREATE TABLE words (
  id INT PRIMARY KEY AUTO_INCREMENT,
  word VARCHAR(100) NOT NULL UNIQUE,
  part_of_speech VARCHAR(50), -- noun, verb, adjective (từ JSON: partOfSpeech)
  level VARCHAR(10), -- A1, A2, B1, B2, C1, C2 (từ JSON: level - có thể null)

  -- Pronunciation (IPA và Audio URLs) - THÔNG TIN CHUNG
  uk_ipa VARCHAR(100),          -- từ JSON: pronunciation.uk.ipa
  uk_audio_url VARCHAR(500),    -- từ JSON: pronunciation.uk.audioUrl
  us_ipa VARCHAR(100),          -- từ JSON: pronunciation.us.ipa
  us_audio_url VARCHAR(500),    -- từ JSON: pronunciation.us.audioUrl

  -- Quick translations - DỊCH NHANH CHUNG cho từ
  quick_translations JSON, -- từ JSON: quickTranslation ["Địa chỉ"]

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_word (word),
  INDEX idx_level (level),
  INDEX idx_part_of_speech (part_of_speech)
);

-- Bảng nghĩa chi tiết - MỖI ROW là 1 NGHĨA CỤ THỂ
CREATE TABLE word_meanings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  word_id INT NOT NULL,
  meaning_id VARCHAR(50) NOT NULL, -- từ JSON: meanings[].id (cambridge-0, cambridge-1, etc.)

  -- Core meaning data - CHI TIẾT TỪNG NGHĨA
  definition TEXT NOT NULL,           -- từ JSON: meanings[].definition
  vietnamese_definition TEXT NOT NULL, -- từ JSON: meanings[].vietnameseDefinition
  grammar VARCHAR(50),                -- từ JSON: meanings[].grammar (có thể khác part_of_speech chính)
  meaning_level VARCHAR(10),          -- A1, A2, B1, B2, C1, C2 cho nghĩa này (có thể null)

  -- Examples cho NGHĨA NÀY - JSON array
  examples JSON, -- từ JSON: meanings[].examples [{"original": "...", "vietnamese": "..."}]

  -- Thesaurus cho NGHĨA NÀY (Cambridge thường không có, để dự phòng)
  thesaurus JSON, -- {"synonyms": ["location", "place"], "antonyms": []} hoặc null

  -- Metadata
  display_order INT DEFAULT 0, -- Thứ tự hiển thị (index trong array)
  source ENUM('cambridge', 'freedict', 'user') DEFAULT 'cambridge',
  contributor_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_word_meanings (word_id, display_order),
  INDEX idx_meaning_id (meaning_id),
  INDEX idx_grammar (grammar),
  INDEX idx_meaning_level (meaning_level),
  INDEX idx_source (source)
);

-- Bảng học tập của user - GIỮ NGUYÊN (đã perfect)
CREATE TABLE user_learning_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  meaning_id INT NOT NULL, -- User chọn NGHĨA CỤ THỂ để học (không phải từ)

  -- Study progress
  confidence_level TINYINT DEFAULT 0,
  study_status ENUM('new', 'learning', 'reviewing', 'mastered') DEFAULT 'new',

  -- Statistics
  times_studied INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_wrong INT DEFAULT 0,
  streak_count INT DEFAULT 0,

  -- Spaced repetition
  last_studied_at TIMESTAMP NULL,
  next_review_at TIMESTAMP NULL,
  review_interval_days INT DEFAULT 3,

  -- Metadata
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  priority TINYINT DEFAULT 5,
  is_favorite BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (meaning_id) REFERENCES word_meanings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_meaning (user_id, meaning_id),

  INDEX idx_user_status (user_id, study_status),
  INDEX idx_next_review (user_id, next_review_at),
  INDEX idx_favorites (user_id, is_favorite)
);
