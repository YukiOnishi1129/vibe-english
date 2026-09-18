import { useSpeech } from "@/shared/hooks/useSpeech";
import { useDailySession } from "@/features/chunks/hooks/useChunks";
import { useLabSession } from "@/features/lab/hooks/useLabSession";
import { LabViewPresenter } from "./LabViewPresenter";

export function LabViewContainer() {
  const { data: session, isPending } = useDailySession();
  const { speak } = useSpeech();

  const lab = useLabSession(session?.chunks ?? []);

  return (
    <LabViewPresenter
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
