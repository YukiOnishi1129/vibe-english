import {
  useDailySession,
  useReviewGroups,
} from "@/features/chunks/hooks/useChunks";
import {
  TodayViewPresenter,
  type PathNode,
  type WeekDay,
} from "./TodayViewPresenter";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * Builds the current week strip from the streak.
 *
 * The API reports a streak length, not a calendar, so days are filled
 * backwards from today: with a streak of N, the last N days up to today count
 * as practised. That matches what the streak means without another endpoint.
 */
function buildWeek(streak: number, practicedToday: boolean): WeekDay[] {
  const now = new Date();
  const todayIndex = now.getDay();
  const practisedDays = practicedToday ? streak : 0;

  return DAY_LABELS.map((label, index) => {
    const daysAgo = todayIndex - index;
    return {
      label,
      // Only days already passed this week can be filled.
      done: daysAgo >= 0 && daysAgo < practisedDays,
      today: index === todayIndex,
    };
  });
}

export function TodayViewContainer() {
  const { data: session, isPending, isError } = useDailySession();
  const { data: reviewGroups } = useReviewGroups();

  const chunks = session?.chunks ?? [];
  const doneOf = (index: number) =>
    (chunks[index]?.progress?.completedCount ?? 0) > 0 &&
    index < (session?.doneCount ?? 0);

  // The queue keeps chunks completed today at the front, so the first
  // unfinished node is the one to do next.
  const firstPending = chunks.findIndex((_, index) => !doneOf(index));

  const nodes: PathNode[] = chunks.map((chunk, index) => ({
    chunk,
    done: doneOf(index),
    current: index === firstPending,
  }));

  const streak = session?.streak ?? {
    current: 0,
    longest: 0,
    practicedToday: false,
  };

  const reviewCount =
    reviewGroups?.reduce((total, group) => total + group.chunks.length, 0) ?? 0;

  return (
    <TodayViewPresenter
      nodes={nodes}
      doneCount={session?.doneCount ?? 0}
      total={session?.total ?? 0}
      streak={streak}
      allDone={Boolean(session && session.total > 0 && firstPending === -1)}
      week={buildWeek(streak.current, streak.practicedToday)}
      reviewCount={reviewCount}
      isLoading={isPending}
      errorMessage={isError ? "読み込みに失敗しました。" : null}
    />
  );
}
