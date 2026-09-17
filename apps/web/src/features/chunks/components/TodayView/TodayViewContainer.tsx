import type { Me } from "@vibe-english/domain";
import { useTodayChunks } from "@/features/chunks/hooks/useChunks";
import { TodayViewPresenter } from "./TodayViewPresenter";

// Collects state from hooks and hands plain values to the presenter.

export function TodayViewContainer({ user }: { user: Me }) {
  const { data: chunks, isPending, isError } = useTodayChunks();

  const doneCount =
    chunks?.filter((chunk) => (chunk.progress?.completedCount ?? 0) > 0)
      .length ?? 0;

  return (
    <TodayViewPresenter
      userName={user.name}
      chunks={chunks}
      doneCount={doneCount}
      isLoading={isPending}
      errorMessage={isError ? "読み込みに失敗しました。" : null}
    />
  );
}
