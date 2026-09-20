import { useSpeech } from "@/shared/hooks/useSpeech";
import {
  useDailySession,
  useReviewGroups,
} from "@/features/chunks/hooks/useChunks";
import { useSessionProgress } from "@/features/chunks/hooks/useSessionProgress";
import { buildSteps } from "@/features/chunks/hooks/usePracticeSession";
import { TodayViewPresenter, type WeekDay } from "./TodayViewPresenter";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * Fills the current week from the streak.
 *
 * The session reports a streak length rather than a calendar, so days are
 * filled backwards from today: with a streak of N, the last N days up to
 * today count as practised.
 */
function buildWeek(streak: number, practicedToday: boolean): WeekDay[] {
  const todayIndex = new Date().getDay();
  const practised = practicedToday ? streak : 0;

  return DAY_LABELS.map((label, index) => {
    const daysAgo = todayIndex - index;
    return {
      label,
      done: daysAgo >= 0 && daysAgo < practised,
      today: index === todayIndex,
    };
  });
}

export function TodayViewContainer() {
  const { data: session, isPending, isError } = useDailySession();
  const { speak } = useSpeech();
  const { progress, reset } = useSessionProgress();
  const { data: reviewGroups } = useReviewGroups();

  const chunks = session?.chunks ?? [];

  // Name the saved position by its step, which is more meaningful than a
  // card number ("穴埋め 2/5" rather than "9枚目").
  const steps = chunks.length > 0 ? buildSteps(chunks) : [];
  const practiceDone = progress?.practiceDone === true;
  const step = progress && !practiceDone ? steps[progress.stepIndex] : undefined;
  const resumeLabel = step
    ? `${step.title} ${progress!.cardIndex + 1}/${step.cards.length}`
    : null;

  const streak = session?.streak ?? {
    current: 0,
    longest: 0,
    practicedToday: false,
  };

  const reviewCount =
    reviewGroups?.reduce((total, group) => total + group.chunks.length, 0) ?? 0;

  return (
    <TodayViewPresenter
      chunks={chunks}
      isLoading={isPending}
      errorMessage={isError ? "読み込みに失敗しました。" : null}
      resumeLabel={resumeLabel}
      practiceDone={practiceDone}
      stepTitles={steps.map((item) => item.title)}
      streak={streak}
      week={buildWeek(streak.current, streak.practicedToday)}
      reviewCount={reviewCount}
      onSpeak={speak}
      onRestart={reset}
    />
  );
}
