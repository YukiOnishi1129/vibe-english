import { useHardChunks } from "@/features/chunks/hooks/useChunks";
import { HardListViewPresenter } from "./HardListViewPresenter";

export function HardListViewContainer() {
  const { data: chunks, isPending, isError } = useHardChunks();

  return (
    <HardListViewPresenter
      chunks={chunks}
      isLoading={isPending}
      errorMessage={isError ? "読み込みに失敗しました。" : null}
    />
  );
}
