CREATE TABLE IF NOT EXISTS chunks (
  id text PRIMARY KEY,
  phrase text NOT NULL,
  meaning_ja text NOT NULL,
  situation text NOT NULL,
  nuance text NOT NULL,
  level text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_active_sort_idx ON chunks (is_active, sort_order);

CREATE TABLE IF NOT EXISTS chunk_examples (
  id text PRIMARY KEY,
  chunk_id text NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  english text NOT NULL,
  japanese text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS chunk_examples_chunk_idx ON chunk_examples (chunk_id, sort_order);

CREATE TABLE IF NOT EXISTS chunk_drills (
  id text PRIMARY KEY,
  chunk_id text NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  type text NOT NULL,
  prompt text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT chunk_drills_type_check CHECK (type IN ('blank', 'translate'))
);

CREATE INDEX IF NOT EXISTS chunk_drills_chunk_idx ON chunk_drills (chunk_id, sort_order);
