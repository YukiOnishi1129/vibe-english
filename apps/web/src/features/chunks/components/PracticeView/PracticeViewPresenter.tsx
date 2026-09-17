import { Link } from "react-router-dom";
import type { Chunk } from "@vibe-english/domain";
import type {
  PracticeCard as Card,
  SwipeDirection,
} from "@/features/chunks/hooks/usePracticeCards";
import { PracticeCard } from "@/features/chunks/components/PracticeView/PracticeCard";

// Presentational only. All data and mutations arrive as props.

export type PracticeViewPresenterProps = {
  chunk: Chunk;
  card: Card | undefined;
  /** Rendered in the card behind, so the swipe reveals real content. */
  nextCard: Card | undefined;
  index: number;
  total: number;
  finished: boolean;
  lastDirection: SwipeDirection;
  dragX: number;
  dragging: boolean;
  flyingOut: "left" | "right" | null;
  saving: boolean;
  saved: boolean;
  streakAfter: number | null;
  errorMessage: string | null;
  swipeHandlers: React.HTMLAttributes<HTMLDivElement>;
  onSpeak: (text: string, rate?: number) => void;
  onDrillAnswer: (drillId: string, correct: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onToggleHard: () => void;
};

export function PracticeViewPresenter({
  chunk,
  card,
  nextCard,
  index,
  total,
  finished,
  lastDirection,
  dragX,
  dragging,
  flyingOut,
  saving,
  saved,
  streakAfter,
  errorMessage,
  swipeHandlers,
  onSpeak,
  onDrillAnswer,
  onNext,
  onBack,
  onToggleHard,
}: PracticeViewPresenterProps) {
  // While dragging the card tracks the pointer. On release it continues off
  // screen instead of springing back, so the swipe reads as the card leaving.
  const rotation = dragX / 22;
  const exitX = flyingOut === "right" ? 640 : -640;

  return (
    <main className="screen practice">
      <header className="practice__bar">
        <Link className="header__link" to="/">
          ← 今日
        </Link>

        <p className="practice__counter">
          {Math.min(index + 1, total)} / {total}
        </p>

        {/* Always reachable, so any card can be bookmarked mid-flow. */}
        <button
          type="button"
          className={`bookmark ${chunk.isHard ? "bookmark--on" : ""}`}
          onClick={onToggleHard}
          aria-pressed={chunk.isHard}
          aria-label={chunk.isHard ? "ブックマークを外す" : "ブックマークする"}
          title="あとで見る"
        >
          <svg viewBox="0 0 24 24" width="1.3em" height="1.3em" aria-hidden="true">
            <path
              d="M6 3.5h12a1 1 0 011 1v16l-7-4-7 4v-16a1 1 0 011-1z"
              fill={chunk.isHard ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <ol className="stepper" aria-label="進捗">
        {Array.from({ length: total }, (_, position) => (
          <li
            key={position}
            className={`stepper__dot ${position <= index ? "stepper__dot--on" : ""}`}
          >
            <span className="visually-hidden">{position + 1}</span>
          </li>
        ))}
      </ol>

      {finished ? (
        <section className="celebrate">
          <p className="celebrate__emoji" aria-hidden="true">
            🎉
          </p>
          <p className="done">{saved ? "記録したよ！" : "おつかれさま！"}</p>
          {streakAfter !== null && (
            <p className="celebrate__streak">🔥 {streakAfter}日連続</p>
          )}
          {saving && <p className="muted">保存中…</p>}
          {errorMessage && <p className="error">{errorMessage}</p>}
          <Link className="button button--primary" to="/">
            つづける
          </Link>
        </section>
      ) : (
        // The gesture lives on the deck, not on the card: a card mid-exit has
        // already left the screen, so it can no longer receive the next grab.
        <div className="deck" {...swipeHandlers}>
          {/* The next card really is behind this one, so dragging uncovers
              the question that is coming rather than an empty placeholder. */}
          <div
            className={`pcard pcard--behind ${
              dragging || flyingOut ? "pcard--behind-rising" : ""
            }`}
            aria-hidden="true"
          >
            {nextCard ? (
              <div className="pcard__slide">
                <p className="pcard__title">{nextCard.title}</p>
                <PracticeCard
                  card={nextCard}
                  onSpeak={() => {}}
                  onDrillAnswer={() => {}}
                />
              </div>
            ) : (
              <div className="pcard__slide pcard__done-peek">
                <p className="pcard__title">おわり</p>
              </div>
            )}
          </div>

          {/* The shell stays mounted so pointer capture is never torn off
              mid-drag; only the contents are keyed, which is what needs to
              re-animate. */}
          <div
            className={[
              "pcard",
              dragging && "pcard--dragging",
              flyingOut && "pcard--leaving",
              // No transition when snapping back to centre after the deck
              // advanced, otherwise the new card slides in from off-screen.
              !flyingOut && !dragging && "pcard--settled",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              flyingOut
                ? {
                    transform: `translateX(${exitX}px) rotate(${
                      flyingOut === "right" ? 18 : -18
                    }deg)`,
                    opacity: 0,
                  }
                : dragging
                  ? {
                      transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
                    }
                  : undefined
            }
            {...swipeHandlers}
          >
            <div key={index} className={`pcard__slide pcard__slide--${lastDirection}`}>
              <p className="pcard__title">{card?.title}</p>
              {card && (
                <PracticeCard
                  card={card}
                  onSpeak={onSpeak}
                  onDrillAnswer={onDrillAnswer}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {!finished && (
        <nav className="deck__nav">
          <button
            type="button"
            className="button button--ghost"
            onClick={onBack}
            disabled={index === 0}
          >
            戻る
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onNext}
          >
            次へ
          </button>
        </nav>
      )}

      {!finished && (
        <p className="deck__hint">カードを左右にスワイプしても進めます</p>
      )}
    </main>
  );
}
