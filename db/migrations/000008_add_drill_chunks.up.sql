-- Word groups for the "build the sentence" step: the answer split into
-- meaningful pieces, so the learner assembles chunks rather than single words.
-- Stored as an ordered array; null means the drill has no build step.
ALTER TABLE chunk_drills
  ADD COLUMN IF NOT EXISTS pieces text[];
