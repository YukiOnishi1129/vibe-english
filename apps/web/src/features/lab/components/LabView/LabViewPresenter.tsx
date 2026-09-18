import { Link } from "react-router-dom";
import type {
  LabCard as Card,
  LabStep,
  StepStatus,
} from "@/features/lab/hooks/useLabSession";
import { LabCard } from "@/features/lab/components/LabCard";
import { StepPicker } from "@/features/lab/components/StepPicker";

// Presentational only: props in, JSX out.

export type LabViewPresenterProps = {
  step: LabStep | undefined;
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

export function LabViewPresenter({
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
}: LabViewPresenterProps) {
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
          <Link className="button button--primary" to="/lab/test">
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
        <span className="lab__steps">
          {stepIndex + 1}/{totalSteps}
        </span>
      </header>

      {/* Steps are freely selectable: "just the blanks today" is a perfectly
          good session, and forcing the order would make it less likely to
          happen at all. */}
      <StepPicker steps={stepStatuses} onSelect={onSelectStep} />

      <p className="lab__hint">{step.hint}</p>

      {/* No swiping here: the practice half is about settling into a rhythm,
          and a gesture that judges nothing only adds a way to slip. */}
      <div className="deck">
        <div className="pcard">
          <div key={`${step.kind}:${cardIndex}`} className="pcard__slide">
            <p className="pcard__title">{step.title}</p>
            <LabCard card={card} onSpeak={onSpeak} />
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
        <button type="button" className="button button--primary" onClick={onNext}>
          次へ
        </button>
      </nav>

    </main>
  );
}
