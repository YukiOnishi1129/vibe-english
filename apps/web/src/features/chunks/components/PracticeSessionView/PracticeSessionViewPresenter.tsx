import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  SessionCard as Card,
  SessionStep,
  StepStatus,
} from "@/features/chunks/hooks/usePracticeSession";
import { SessionCard } from "@/features/chunks/components/SessionCard";
import { StepPicker } from "@/features/chunks/components/StepPicker";

// Presentational only: props in, JSX out.

export type PracticeSessionViewPresenterProps = {
  step: SessionStep | undefined;
  stepStatuses: StepStatus[];
  card: Card | undefined;
  stepIndex: number;
  cardIndex: number;
  totalSteps: number;
  finished: boolean;
  isLoading: boolean;
  onSpeak: (text: string, rate?: number) => void;
  onNext: () => void;
  onBack: () => void;
  onSelectStep: (index: number) => void;
};

export function PracticeSessionViewPresenter({
  step,
  stepStatuses,
  card,
  stepIndex,
  cardIndex,
  totalSteps,
  finished,
  isLoading,
  onSpeak,
  onNext,
  onBack,
  onSelectStep,
}: PracticeSessionViewPresenterProps) {
  // Questions have to be attempted before moving on; the other steps are
  // just shown, so they unlock immediately.
  const [answered, setAnswered] = useState(true);

  const cardKey = card ? `${card.kind}:${card.chunk.id}` : "";
  useEffect(() => setAnswered(true), [cardKey]);

  const handleAnsweredChange = useCallback(
    (value: boolean) => setAnswered(value),
    [],
  );

  if (isLoading) {
    return (
      <main className="screen screen--center">
        <p className="muted">読み込み中…</p>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="screen">
        <section className="celebrate">
          <p className="celebrate__emoji" aria-hidden="true">
            🎉
          </p>
          <p className="done">練習おわり！</p>
          <p className="muted">つづけてテストで確認してみよう。</p>
          <Link className="button button--primary" to="/test">
            テストへ
          </Link>
          <Link className="button button--ghost" to="/">
            今日へもどる
          </Link>
        </section>
      </main>
    );
  }

  if (!step || !card) return null;

  return (
    <main className="screen">
      <header className="practice__bar">
        <Link className="header__link" to="/">
          ← 今日
        </Link>
        <p className="practice__counter">
          {step.title} {cardIndex + 1}/{step.cards.length}
        </p>
        <span className="session__steps">
          {stepIndex + 1}/{totalSteps}
        </span>
      </header>

      {/* Steps are freely selectable: "just the blanks today" is a perfectly
          good session, and forcing the order would make it less likely to
          happen at all. */}
      <StepPicker steps={stepStatuses} onSelect={onSelectStep} />

      {/* No swiping here: the practice half is about settling into a rhythm,
          and a gesture that judges nothing only adds a way to slip. */}
      <div className="deck">
        <div className="pcard">
          <div key={`${step.kind}:${cardIndex}`} className="pcard__slide">
            <p className="pcard__title">{step.title}</p>
            <SessionCard
              card={card}
              onSpeak={onSpeak}
              onAnsweredChange={handleAnsweredChange}
            />
          </div>
        </div>
      </div>

      <nav className="deck__nav">
        <button
          type="button"
          className="button button--ghost"
          onClick={onBack}
          disabled={stepIndex === 0 && cardIndex === 0}
        >
          戻る
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onNext}
          disabled={!answered}
        >
          次へ
        </button>
      </nav>

    </main>
  );
}
