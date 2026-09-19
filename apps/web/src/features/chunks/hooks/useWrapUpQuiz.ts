import { useCallback, useMemo, useRef, useState } from "react";
import type { Chunk, ChunkDrill } from "@vibe-english/domain";
import { seededShuffle } from "@/features/chunks/utils/shuffle";

export type QuizQuestion = {
  chunkId: string;
  phrase: string;
  drill: ChunkDrill;
  /**
   * Japanese for the sentence the blank came from.
   *
   * A blank has several defensible answers without it — "Can I ___ a coffee?"
   * fits get, have and order alike — so the test would be guessing, not
   * recall.
   */
  gloss: string | null;
};

/** How many questions the wrap-up asks, however many chunks are available. */
export const QUIZ_LENGTH = 5;

export function buildQuiz(chunks: Chunk[], seed: number): QuizQuestion[] {
  const pool: QuizQuestion[] = [];

  for (const chunk of chunks) {
    // The spoken drill's prompt is the Japanese for the same sentence the
    // blank is built from, so it doubles as the blank's gloss.
    const gloss =
      chunk.drills.find((drill) => drill.type === "translate")?.prompt ?? null;

    for (const drill of chunk.drills) {
      pool.push({ chunkId: chunk.id, phrase: chunk.phrase, drill, gloss });
    }
  }

  // One question per chunk first, so every phrase from the day shows up before
  // any phrase repeats.
  const shuffled = seededShuffle(pool, seed);
  const seen = new Set<string>();
  const spread: QuizQuestion[] = [];
  const rest: QuizQuestion[] = [];

  for (const question of shuffled) {
    if (seen.has(question.chunkId)) rest.push(question);
    else {
      seen.add(question.chunkId);
      spread.push(question);
    }
  }

  return [...spread, ...rest].slice(0, QUIZ_LENGTH);
}

export type QuizResult = {
  correct: number;
  total: number;
  missedChunkIds: string[];
};

export function useWrapUpQuiz(
  chunks: Chunk[],
  onFinish?: (result: QuizResult) => void,
) {
  // Seeded once per mount so the order is stable while answering.
  const seedRef = useRef(Math.floor(Math.random() * 2 ** 31) || 1);
  const questions = useMemo(
    () => buildQuiz(chunks, seedRef.current),
    [chunks],
  );

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const missed = useRef<Set<string>>(new Set());

  const finished = index >= questions.length;

  // Guards against React running the state updater twice (StrictMode) and
  // reporting the same result to the server more than once.
  const reported = useRef(false);

  const answer = useCallback(
    (wasCorrect: boolean) => {
      const question = questions[index];
      if (!question) return;

      if (wasCorrect) setCorrect((value) => value + 1);
      else missed.current.add(question.chunkId);

      const next = index + 1;
      setIndex(next);

      if (next === questions.length && !reported.current) {
        reported.current = true;
        onFinish?.({
          correct: wasCorrect ? correct + 1 : correct,
          total: questions.length,
          missedChunkIds: [...missed.current],
        });
      }
    },
    [questions, index, correct, onFinish],
  );

  const restart = useCallback(() => {
    seedRef.current = Math.floor(Math.random() * 2 ** 31) || 1;
    missed.current = new Set();
    reported.current = false;
    setIndex(0);
    setCorrect(0);
  }, []);

  return {
    questions,
    question: questions[index],
    index,
    total: questions.length,
    correct,
    finished,
    answer,
    restart,
  };
}
