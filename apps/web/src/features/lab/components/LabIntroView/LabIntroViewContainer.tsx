import { useSpeech } from "@/shared/hooks/useSpeech";
import { useDailySession } from "@/features/chunks/hooks/useChunks";
import { useLabProgress } from "@/features/lab/hooks/useLabProgress";
import { buildSteps } from "@/features/lab/hooks/useLabSession";
import { LabIntroViewPresenter } from "./LabIntroViewPresenter";

export function LabIntroViewContainer() {
  const { data: session, isPending, isError } = useDailySession();
  const { speak } = useSpeech();
  const { progress, reset } = useLabProgress();

  const chunks = session?.chunks ?? [];

  // Name the saved position by its step, which is more meaningful than a
  // card number ("穴埋め 2/5" rather than "9枚目").
  const steps = chunks.length > 0 ? buildSteps(chunks) : [];
  const step = progress ? steps[progress.stepIndex] : undefined;
  const resumeLabel = step
    ? `${step.title} ${progress!.cardIndex + 1}/${step.cards.length}`
    : null;

  return (
    <LabIntroViewPresenter
      chunks={chunks}
      isLoading={isPending}
      errorMessage={isError ? "読み込みに失敗しました。" : null}
      resumeLabel={resumeLabel}
      onSpeak={speak}
      onRestart={reset}
    />
  );
}
