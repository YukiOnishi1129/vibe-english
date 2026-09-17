import { Link, useNavigate, useParams } from "react-router-dom";
import { useSpeech } from "@/shared/hooks/useSpeech";
import {
  useChunkDetail,
  useFinishChunk,
  useToggleHardFlag,
} from "@/features/chunks/hooks/useChunks";
import { usePracticeSteps } from "@/features/chunks/hooks/usePracticeSteps";
import { PracticeViewPresenter } from "./PracticeViewPresenter";

export function PracticeViewContainer() {
  const { chunkId } = useParams<{ chunkId: string }>();
  const navigate = useNavigate();
  const { supported, speak } = useSpeech();
  const steps = usePracticeSteps();

  const { data: chunk, isPending, isError } = useChunkDetail(chunkId);
  const finish = useFinishChunk(chunkId ?? "");
  const toggleHard = useToggleHardFlag(chunkId ?? "");

  if (isError) {
    return (
      <main className="screen">
        <p className="error">このフレーズを読み込めませんでした。</p>
        <Link className="button button--ghost" to="/">
          今日へ戻る
        </Link>
      </main>
    );
  }

  if (isPending || !chunk) {
    return (
      <main className="screen screen--center">
        <p className="muted">読み込み中…</p>
      </main>
    );
  }

  return (
    <PracticeViewPresenter
      chunk={chunk}
      step={steps.step}
      stepIndex={steps.index}
      steps={steps.steps}
      isFirst={steps.isFirst}
      isLast={steps.isLast}
      speechSupported={supported}
      completed={finish.isSuccess}
      saving={finish.isPending}
      streakAfter={finish.data?.streak.current ?? null}
      errorMessage={
        finish.isError ? "保存に失敗しました。もう一度お試しください。" : null
      }
      onSpeak={speak}
      onToggleHard={() => toggleHard.mutate(!chunk.isHard)}
      onFinish={(result) => finish.mutate(result)}
      onNext={steps.next}
      onBack={steps.back}
      onLeave={() => navigate("/")}
    />
  );
}
