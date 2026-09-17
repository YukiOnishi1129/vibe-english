import { useReviewGroups } from "@/features/chunks/hooks/useChunks";
import { ReviewViewPresenter } from "./ReviewViewPresenter";

export function ReviewViewContainer() {
  const { data: groups, isPending, isError } = useReviewGroups();

  return (
    <ReviewViewPresenter
      groups={groups ?? []}
      isLoading={isPending}
      errorMessage={isError ? "読み込みに失敗しました。" : null}
    />
  );
}
