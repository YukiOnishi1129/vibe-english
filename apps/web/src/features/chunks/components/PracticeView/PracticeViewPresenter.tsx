import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Chunk, ChunkDrill } from "@vibe-english/domain";
import type { PracticeStep } from "@/features/chunks/hooks/usePracticeSteps";

// Presentational only. All data and mutations arrive as props.

/** Local reveal state is pure UI, so it stays inside the presenter. */
function DrillStep({
  drill,
  hint,
  onSpeak,
}: {
  drill: ChunkDrill | null;
  hint: string;
  onSpeak: (text: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => setRevealed(false), [drill?.id]);

  if (!drill) return <p className="muted">この問題はまだありません。</p>;

  return (
    <div className="step__body">
      <p className="muted">{hint}</p>
      <p className="prompt">{drill.prompt}</p>

      {revealed ? (
        <div className="answer">
          <p className="answer__text">{drill.answer}</p>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onSpeak(drill.answer)}
          >
            🔊 答えを聞く
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setRevealed(true)}
        >
          答えを見る
        </button>
      )}
    </div>
  );
}

export type PracticeViewPresenterProps = {
  chunk: Chunk;
  step: PracticeStep;
  stepIndex: number;
  steps: readonly string[];
  isLast: boolean;
  isFirst: boolean;
  speechSupported: boolean;
  completed: boolean;
  saving: boolean;
  errorMessage: string | null;
  onSpeak: (text: string, rate?: number) => void;
  onToggleHard: () => void;
  onFinish: (result: "got_it" | "struggled") => void;
  streakAfter: number | null;
  onNext: () => void;
  onBack: () => void;
  onLeave: () => void;
};

export function PracticeViewPresenter({
  chunk,
  step,
  stepIndex,
  steps,
  isLast,
  isFirst,
  speechSupported,
  completed,
  saving,
  errorMessage,
  onSpeak,
  onToggleHard,
  onFinish,
  streakAfter,
  onNext,
  onBack,
  onLeave,
}: PracticeViewPresenterProps) {
  const firstExample = chunk.examples[0];
  const drillOf = (type: ChunkDrill["type"]) =>
    chunk.drills.find((drill) => drill.type === type) ?? null;

  return (
    <main className="screen">
      <header className="header">
        <Link className="header__link" to="/">
          ← 今日
        </Link>
        <button
          type="button"
          className={`chip ${chunk.isHard ? "chip--on" : ""}`}
          onClick={onToggleHard}
          aria-pressed={chunk.isHard}
        >
          難しい
        </button>
      </header>

      <h1 className="practice__phrase">
        <span>{chunk.phrase}</span>
      </h1>

      <ol className="stepper" aria-label="練習ステップ">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`stepper__dot ${index <= stepIndex ? "stepper__dot--on" : ""}`}
            aria-current={index === stepIndex ? "step" : undefined}
          >
            <span className="visually-hidden">{label}</span>
          </li>
        ))}
      </ol>

      <section className="step">
        <h2 className="step__title">
          {stepIndex + 1}. {step}
        </h2>

        {!speechSupported && step !== "使い方" && (
          <p className="muted">このブラウザは音声読み上げに対応していません。</p>
        )}

        {step === "聞く" && (
          <div className="step__body">
            <p className="muted">まずは音を聞いてみよう。</p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onSpeak(chunk.phrase)}
            >
              🔊 聞く
            </button>
            {firstExample && (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => onSpeak(firstExample.english)}
              >
                🔊 例文を聞く
              </button>
            )}
          </div>
        )}

        {step === "まねる" && (
          <div className="step__body">
            <p className="muted">声に出してまねしてみよう。録音はしません。</p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onSpeak(chunk.phrase, 0.75)}
            >
              🐢 ゆっくり聞く
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => onSpeak(chunk.phrase)}
            >
              🔊 普通の速さ
            </button>
          </div>
        )}

        {step === "使い方" && (
          <div className="step__body">
            <dl className="usage">
              <dt>意味</dt>
              <dd>{chunk.meaningJa}</dd>
              <dt>場面</dt>
              <dd>{chunk.situation}</dd>
              <dt>ニュアンス</dt>
              <dd>{chunk.nuance}</dd>
            </dl>
          </div>
        )}

        {step === "穴埋め" && (
          <DrillStep
            drill={drillOf("blank")}
            hint="空欄に入る語は？"
            onSpeak={onSpeak}
          />
        )}

        {step === "日本語から" && (
          <DrillStep
            drill={drillOf("translate")}
            hint="英語にしてみよう。"
            onSpeak={onSpeak}
          />
        )}

        {step === "全文" && (
          <ul className="examples">
            {chunk.examples.map((example) => (
              <li key={example.id} className="examples__item">
                <button
                  type="button"
                  className="examples__play"
                  onClick={() => onSpeak(example.english)}
                  aria-label={`${example.english} を再生`}
                >
                  🔊
                </button>
                <div>
                  <p className="examples__en">{example.english}</p>
                  <p className="examples__ja">{example.japanese}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {step === "完了" && (
          <div className="step__body">
            {completed ? (
              <div className="celebrate">
                <p className="celebrate__emoji" aria-hidden="true">
                  🎉
                </p>
                <p className="done">ナイス！記録したよ。</p>
                {streakAfter !== null && (
                  <p className="celebrate__streak">🔥 {streakAfter}日連続</p>
                )}
                <Link className="button button--primary" to="/">
                  つづける
                </Link>
              </div>
            ) : (
              <>
                <p className="muted">口に出せた？正直でOK。</p>
                <button
                  type="button"
                  className="button button--success"
                  onClick={() => onFinish("got_it")}
                  disabled={saving}
                >
                  {saving ? "保存中…" : "言えた 😎"}
                </button>
                <button
                  type="button"
                  className="button button--warn"
                  onClick={() => onFinish("struggled")}
                  disabled={saving}
                >
                  むずかった 😅
                </button>
              </>
            )}
            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>
        )}
      </section>

      <nav className="nav">
        <button
          type="button"
          className="button button--ghost"
          onClick={onBack}
          disabled={isFirst}
        >
          戻る
        </button>
        {isLast ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={onLeave}
          >
            一覧へ
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={onNext}
          >
            次へ
          </button>
        )}
      </nav>
    </main>
  );
}
