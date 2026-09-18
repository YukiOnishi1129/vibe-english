import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Chunk, ChunkDrill } from "@vibe-english/domain";
import {
  clearProgress,
  loadProgress,
  saveProgress,
} from "@/features/lab/utils/progress";

/**
 * An alternative lesson shape, kept side by side with the current one so the
 * two can be compared before either is committed to.
 *
 * The current flow walks one phrase through every angle (listen, meaning,
 * drill…) before moving on. This one does the opposite: one angle at a time
 * across all five phrases. Repeating the same kind of task five times in a row
 * is easier to settle into than switching mode on every card.
 */
export type LabStepKind = "meaning" | "speak" | "blank" | "translate";

export type LabCard = {
  kind: LabStepKind;
  chunk: Chunk;
  drill: ChunkDrill | null;
};

export type LabStep = {
  kind: LabStepKind;
  title: string;
  hint: string;
  cards: LabCard[];
};

export type StepStatus = {
  index: number;
  title: string;
  /** Every card in this step has been seen. */
  done: boolean;
  current: boolean;
};

const STEP_META: { kind: LabStepKind; title: string; hint: string }[] = [
  { kind: "meaning", title: "意味", hint: "どんな意味か見てみよう" },
  { kind: "speak", title: "発音", hint: "聞いて、まねして言ってみよう" },
  { kind: "blank", title: "穴埋め", hint: "空欄に入る語は？" },
  { kind: "translate", title: "話す", hint: "日本語を見て、英語で言ってみよう" },
];

function drillOf(chunk: Chunk, type: ChunkDrill["type"]): ChunkDrill | null {
  return chunk.drills.find((drill) => drill.type === type) ?? null;
}

export function buildSteps(chunks: Chunk[]): LabStep[] {
  return STEP_META.map((meta) => ({
    ...meta,
    cards: chunks
      .map((chunk) => ({
        kind: meta.kind,
        chunk,
        drill:
          meta.kind === "blank"
            ? drillOf(chunk, "blank")
            : meta.kind === "translate"
              ? drillOf(chunk, "translate")
              : null,
      }))
      // A phrase without the drill for this step would be a blank card.
      .filter((card) => meta.kind === "meaning" || meta.kind === "speak" || card.drill),
  })).filter((step) => step.cards.length > 0);
}

export function useLabSession(chunks: Chunk[]) {
  const steps = useMemo(() => buildSteps(chunks), [chunks]);

  // Resume where the session was left off, but only within the same day:
  // tomorrow's phrases are different, so an old position would be meaningless.
  const [stepIndex, setStepIndex] = useState(() => loadProgress()?.stepIndex ?? 0);
  const [cardIndex, setCardIndex] = useState(() => loadProgress()?.cardIndex ?? 0);
  const missed = useRef<Set<string>>(new Set());

  const step = steps[stepIndex];
  const finished = stepIndex >= steps.length;

  // Tracks how far the session has reached, which is what the dots show even
  // after jumping back to an earlier step.
  const [furthest, setFurthest] = useState(() => loadProgress()?.stepIndex ?? 0);
  useEffect(() => {
    setFurthest((value) => Math.max(value, stepIndex));
  }, [stepIndex]);

  useEffect(() => {
    if (steps.length === 0) return;
    if (finished) clearProgress();
    else saveProgress(stepIndex, cardIndex);
  }, [steps.length, finished, stepIndex, cardIndex]);

  // A saved position can outlive a shorter deck (content changed, a drill
  // removed); clamp rather than render an empty card.
  useEffect(() => {
    if (steps.length === 0 || stepIndex < steps.length) return;
    if (stepIndex > steps.length) setStepIndex(steps.length);
  }, [steps.length, stepIndex]);

  const next = useCallback(() => {
    const current = steps[stepIndex];
    if (!current) return;

    if (cardIndex + 1 < current.cards.length) {
      setCardIndex((value) => value + 1);
      return;
    }
    setStepIndex((value) => value + 1);
    setCardIndex(0);
  }, [steps, stepIndex, cardIndex]);

  const back = useCallback(() => {
    if (cardIndex > 0) {
      setCardIndex((value) => value - 1);
      return;
    }
    if (stepIndex === 0) return;

    const previous = steps[stepIndex - 1];
    setStepIndex(stepIndex - 1);
    setCardIndex(Math.max(0, previous.cards.length - 1));
  }, [steps, stepIndex, cardIndex]);

  /** Jumps straight to a step, so a short session can be just one of them. */
  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) return;
      setStepIndex(index);
      setCardIndex(0);
    },
    [steps.length],
  );

  const markMissed = useCallback((chunkId: string, missedIt: boolean) => {
    if (missedIt) missed.current.add(chunkId);
    else missed.current.delete(chunkId);
  }, []);

  const reset = useCallback(() => {
    setStepIndex(0);
    setCardIndex(0);
    missed.current = new Set();
    clearProgress();
  }, []);

  // A step counts as done once the learner has moved past it; with free
  // jumping that is "further along than this one", not "visited".
  const stepStatuses: StepStatus[] = steps.map((item, index) => ({
    index,
    title: item.title,
    done: index < furthest,
    current: index === stepIndex,
  }));

  return {
    steps,
    stepStatuses,
    step,
    card: step?.cards[cardIndex],
    stepIndex,
    cardIndex,
    totalSteps: steps.length,
    finished,
    missedChunkIds: () => [...missed.current],
    next,
    back,
    goToStep,
    markMissed,
    reset,
  };
}
