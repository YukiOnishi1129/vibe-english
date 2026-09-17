import { useCallback, useMemo, useState } from "react";

export const PRACTICE_STEPS = [
  "聞く",
  "まねる",
  "使い方",
  "穴埋め",
  "日本語から",
  "全文",
  "完了",
] as const;

export type PracticeStep = (typeof PRACTICE_STEPS)[number];

/** Owns step navigation so the presenter stays free of state. */
export function usePracticeSteps() {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => Math.min(PRACTICE_STEPS.length - 1, i + 1)),
    [],
  );
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const reset = useCallback(() => setIndex(0), []);

  return useMemo(
    () => ({
      index,
      step: PRACTICE_STEPS[index],
      steps: PRACTICE_STEPS,
      isFirst: index === 0,
      isLast: index === PRACTICE_STEPS.length - 1,
      next,
      back,
      reset,
    }),
    [index, next, back, reset],
  );
}
