import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useSpeech } from "@/shared/hooks/useSpeech";
import { useSwipe } from "@/shared/hooks/useSwipe";
import {
  useChunkDetail,
  useFinishChunk,
  useToggleHardFlag,
} from "@/features/chunks/hooks/useChunks";
import { usePracticeCards } from "@/features/chunks/hooks/usePracticeCards";
import { PracticeViewPresenter } from "./PracticeViewPresenter";

export function PracticeViewContainer() {
  const { chunkId } = useParams<{ chunkId: string }>();
  const { supported, speak } = useSpeech();

  const { data: chunk, isPending, isError } = useChunkDetail(chunkId);
  const finish = useFinishChunk(chunkId ?? "");
  const toggleHard = useToggleHardFlag(chunkId ?? "");

  // Saving happens the moment the last card is dismissed, not in an effect:
  // the deck hands back the outcome it has just computed, so there is no
  // window where a render could read a stale answer set.
  const saved = useRef(false);
  const handleComplete = (struggled: boolean) => {
    if (saved.current || !chunkId) return;
    saved.current = true;
    finish.mutate(struggled ? "struggled" : "got_it");
  };

  const deck = usePracticeCards(chunk, handleComplete);
  const { state, handlers } = useSwipe(deck.advance);

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
      card={deck.card}
      nextCard={deck.nextCard}
      index={deck.index}
      total={deck.total}
      finished={deck.finished}
      lastDirection={deck.lastDirection}
      dragX={state.dx}
      dragging={state.dragging}
      flyingOut={state.flyingOut}
      saving={finish.isPending}
      saved={finish.isSuccess}
      streakAfter={finish.data?.streak.current ?? null}
      errorMessage={
        !supported && deck.card?.kind === "listen"
          ? "このブラウザは音声読み上げに対応していません。"
          : finish.isError
            ? "保存に失敗しました。"
            : null
      }
      swipeHandlers={handlers}
      onSpeak={speak}
      onDrillAnswer={deck.markDrill}
      onNext={() => deck.advance("right")}
      onBack={deck.back}
      onToggleHard={() => toggleHard.mutate(!chunk.isHard)}
    />
  );
}
