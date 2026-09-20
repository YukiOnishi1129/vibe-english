import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { QuizQuestion } from "@/features/chunks/hooks/useWrapUpQuiz";
import { isAnswerCorrect } from "@/features/chunks/utils/answer";

// Presentational only. The test half judges; the practice half does not.

export type TestViewPresenterProps = {
  question: QuizQuestion | undefined;
  index: number;
  total: number;
  correct: number;
  finished: boolean;
  isLoading: boolean;
  dragX: number;
  dragging: boolean;
  swipeHandlers: React.HTMLAttributes<HTMLDivElement>;
  onAnswer: (wasCorrect: boolean) => void;
  onSpeak: (text: string) => void;
  onRestart: () => void;
};

export function TestViewPresenter({
  question,
  index,
  total,
  correct,
  finished,
  isLoading,
  dragX,
  dragging,
  swipeHandlers,
  onAnswer,
  onSpeak,
  onRestart,
}: TestViewPresenterProps) {
  const [value, setValue] = useState("");
  const [judged, setJudged] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const questionId = question?.drill.id;
  useEffect(() => {
    setValue("");
    setJudged(null);
    setRevealed(false);
  }, [questionId]);

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
            {correct === total ? "🏆" : "🎉"}
          </p>
          <p className="done">
            {total}問中 {correct}問 正解
          </p>
          <p className="muted">
            {correct === total
              ? "できなかったものはなし。いい流れ。"
              : "できなかったものは復習に入れておいたよ。"}
          </p>
          {/* Another go is the likely next step right after a score, so it
              leads; the way out stays visible underneath. */}
          <button
            type="button"
            className="button button--primary"
            onClick={onRestart}
          >
            もう一度テスト
          </button>
          <Link className="button button--ghost" to="/practice">
            練習にもどる
          </Link>
          <Link className="button button--ghost" to="/">
            今日へもどる
          </Link>
        </section>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="screen">
        <p className="muted">出題できる問題がありません。</p>
        <Link className="button button--ghost" to="/">
          今日へもどる
        </Link>
      </main>
    );
  }

  const { drill } = question;
  const typed = drill.type === "blank";

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

      <div className="deck" {...(typed ? {} : swipeHandlers)}>
        <div
          className={`pcard ${dragging ? "pcard--dragging" : ""}`}
          style={
            !typed && dragging
              ? { transform: `translateX(${dragX}px) rotate(${dragX / 22}deg)` }
              : undefined
          }
        >
          <p className="pcard__title">{typed ? "穴埋め" : "日本語から"}</p>

          <div className="pcard__body">
            <p className="pcard__prompt">{drill.prompt}</p>
            {typed && question.gloss && (
              <p className="scard__gloss">{question.gloss}</p>
            )}

            {typed ? (
              <>
                <form
                  className="answerbox"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (judged !== null || value.trim() === "") return;
                    setJudged(isAnswerCorrect(value, drill.answer));
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
            ) : !revealed ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setRevealed(true)}
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
                {/* Speaking cannot be graded, so the learner reports it — and
                    a swipe is quicker than aiming at a button. */}
                <p className="session__swipehint">
                  右にスワイプ = 言えた / 左 = まだ
                </p>
                <div className="pcard__judge">
                  <button
                    type="button"
                    className="button button--warn"
                    onClick={() => onAnswer(false)}
                  >
                    まだ
                  </button>
                  <button
                    type="button"
                    className="button button--success"
                    onClick={() => onAnswer(true)}
                  >
                    言えた
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
