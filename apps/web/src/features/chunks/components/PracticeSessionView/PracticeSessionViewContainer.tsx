import { useSpeech } from "@/shared/hooks/useSpeech";
import { useDailySession } from "@/features/chunks/hooks/useChunks";
import { usePracticeSession } from "@/features/chunks/hooks/usePracticeSession";
import { PracticeSessionViewPresenter } from "./PracticeSessionViewPresenter";

export function PracticeSessionViewContainer() {
  const { data: session, isPending } = useDailySession();
  const { speak } = useSpeech();

  const lab = usePracticeSession(session?.chunks ?? []);

  return (
    <PracticeSessionViewPresenter
      step={lab.step}
      stepStatuses={lab.stepStatuses}
      card={lab.card}
      stepIndex={lab.stepIndex}
      cardIndex={lab.cardIndex}
      totalSteps={lab.totalSteps}
      finished={lab.finished}
      isLoading={isPending}
      onSpeak={speak}
      onNext={lab.next}
      onBack={lab.back}
      onSelectStep={lab.goToStep}
    />
  );
}
