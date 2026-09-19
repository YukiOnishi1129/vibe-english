import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { QuizQuestion } from "@/features/chunks/hooks/useWrapUpQuiz";

// Presentational only: props in, JSX out.

/** Same forgiving rule the practice deck uses. */
function isCorrect(input: string, answer: string): boolean {
  const normalise = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[.!?,]+$/g, "")
      .replace(/\s+/g, " ");

  return normalise(input) === normalise(answer);
}

export type QuizViewPresenterProps = {
  question: QuizQuestion | undefined;
  index: number;
  total: number;
  correct: number;
  finished: boolean;
  isLoading: boolean;
  onAnswer: (wasCorrect: boolean) => void;
  onSpeak: (text: string) => void;
  onRestart: () => void;
};

export function QuizViewPresenter({
  question,
  index,
  total,
  correct,
  finished,
  isLoading,
  onAnswer,
  onSpeak,
  onRestart,
}: QuizViewPresenterProps) {
  const [value, setValue] = useState("");
  const [judged, setJudged] = useState<boolean | null>(null);

  // Every question starts from a blank slate.
  const questionId = question?.drill.id;
  useEffect(() => {
    setValue("");
    setJudged(null);
  }, [questionId]);

  if (isLoading) {
    return (
      <main className="screen screen--center">
        <p className="muted">読み込み中…</p>
      </main>
    );
  }

  if (total === 0) {
    return (
      <main className="screen">
        <p className="muted">出題できるフレーズがありません。</p>
        <Link className="button button--ghost" to="/">
          今日へ戻る
        </Link>
      </main>
    );
  }

  if (finished) {
    const perfect = correct === total;
    return (
      <main className="screen">
        <section className="celebrate">
          <p className="celebrate__emoji" aria-hidden="true">
            {perfect ? "🏆" : "🎉"}
          </p>
          <p className="done">
            {perfect ? "全問正解！" : `${total}問中 ${correct}問 正解`}
          </p>
          <p className="muted">
            {perfect
              ? "完璧。今日はここまでで十分。"
              : "間違えたフレーズは復習に入れておいたよ。"}
          </p>
          <Link className="button button--primary" to="/">
            今日へ戻る
          </Link>
          <button type="button" className="button button--ghost" onClick={onRestart}>
            もう一回
          </button>
        </section>
      </main>
    );
  }

  if (!question) return null;

  const { drill } = question;
  const typed = drill.type === "blank";

  const submit = () => {
    if (judged !== null || value.trim() === "") return;
    const ok = isCorrect(value, drill.answer);
    setJudged(ok);
  };

  return (
    <main className="screen">
      <header className="practice__bar">
        <Link className="header__link" to="/">
          ← 今日
        </Link>
        <p className="practice__counter">
          {index + 1} / {total}
        </p>
        <span className="quiz__score">{correct}✓</span>
      </header>

      <ol className="stepper" aria-label="進捗">
        {Array.from({ length: total }, (_, position) => (
          <li
            key={position}
            className={`stepper__dot ${position < index ? "stepper__dot--on" : ""}`}
          >
            <span className="visually-hidden">{position + 1}</span>
          </li>
        ))}
      </ol>

      <div className="pcard">
        <p className="pcard__title">{typed ? "穴埋め" : "日本語から"}</p>

        <div className="pcard__body">
          <p className="pcard__kicker">
            {typed ? "空欄に入るのは？" : "声に出して英語にしてみよう"}
          </p>
          <p className="pcard__prompt">{drill.prompt}</p>
          {typed && question.gloss && (
            <p className="labcard__gloss">{question.gloss}</p>
          )}

          {typed ? (
            <>
              <form
                className="answerbox"
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <input
                  className={[
                    "answerbox__input",
                    judged === true && "answerbox__input--ok",
                    judged === false && "answerbox__input--ng",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="ここに入力"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={judged !== null}
                  aria-label="答えを入力"
                />
                {judged === null && (
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={value.trim() === ""}
                  >
                    答える
                  </button>
                )}
              </form>

              {judged !== null && (
                <div className="answerbox__result">
                  <p className={judged ? "answerbox__ok" : "answerbox__ng"}>
                    {judged ? "正解！ 🎉" : `答えは "${drill.answer}"`}
                  </p>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => onAnswer(judged)}
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          ) : judged === null ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setJudged(false)}
            >
              答えを見る
            </button>
          ) : (
            <>
              <p className="pcard__reveal">{drill.answer}</p>
              <button
                type="button"
                className="button button--ghost pcard__listen"
                onClick={() => onSpeak(drill.answer)}
              >
                🔊 聞く
              </button>
              <div className="pcard__judge">
                <button
                  type="button"
                  className="button button--success"
                  onClick={() => onAnswer(true)}
                >
                  言えた
                </button>
                <button
                  type="button"
                  className="button button--warn"
                  onClick={() => onAnswer(false)}
                >
                  言えなかった
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
