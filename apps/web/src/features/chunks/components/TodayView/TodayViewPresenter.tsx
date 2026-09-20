import { Link } from "react-router-dom";
import type { Chunk, Streak } from "@vibe-english/domain";

// Presentational only: props in, JSX out.

export type TodayViewPresenterProps = {
  chunks: Chunk[];
  isLoading: boolean;
  errorMessage: string | null;
  /** Where the learner left off today, if anywhere. */
  resumeLabel: string | null;
  /** Every step has been worked through today. */
  practiceDone: boolean;
  /** Step names, so the summary cannot drift from the real sequence. */
  stepTitles: string[];
  streak: Streak;
  week: WeekDay[];
  reviewCount: number;
  onSpeak: (text: string) => void;
  onRestart: () => void;
};

export type WeekDay = {
  label: string;
  done: boolean;
  today: boolean;
};

export function TodayViewPresenter({
  chunks,
  isLoading,
  errorMessage,
  resumeLabel,
  practiceDone,
  stepTitles,
  streak,
  week,
  reviewCount,
  onSpeak,
  onRestart,
}: TodayViewPresenterProps) {
  return (
    <main className="screen">
      <header className="hud">
        <span className="hud__streak" title="連続日数">
          🔥 <strong>{streak.current}</strong>
        </span>
        <span className="hud__progress">
          {practiceDone ? "今日は練習ずみ" : "今日のぶん"}
        </span>
      </header>

      <header className="page-head">
        <h1 className="page-head__title">今日のフレーズ</h1>
        <p className="muted">
          この{chunks.length}つを、{stepTitles.join(" → ")} の順に。
        </p>
      </header>

      {errorMessage && <p className="error">{errorMessage}</p>}
      {isLoading && <p className="muted">読み込み中…</p>}

      {/* Shown before starting so the session has a known shape: five phrases,
          then done. Nothing here is tappable into practice — it is a preview,
          not a menu. */}
      <ol className="preview">
        {chunks.map((chunk, index) => (
          <li key={chunk.id} className="preview__item">
            <span className="preview__number" aria-hidden="true">
              {index + 1}
            </span>
            <div className="preview__main">
              <p className="preview__phrase">{chunk.phrase}</p>
              <p className="preview__meaning">{chunk.meaningJa}</p>
            </div>
            <button
              type="button"
              className="examples__play"
              onClick={() => onSpeak(chunk.phrase)}
              aria-label={`${chunk.phrase} を再生`}
            >
              🔊
            </button>
          </li>
        ))}
      </ol>

      {chunks.length > 0 && (
        <div className="preview__start">
          {practiceDone ? (
            <>
              {/* Practice is done for today, so the test is the next thing to
                  do rather than another pass through the cards. */}
              <Link className="button button--primary" to="/test">
                テストをやる
              </Link>
              <Link
                className="button button--ghost"
                to="/practice"
                onClick={onRestart}
              >
                もう一度練習する
              </Link>
              <p className="preview__note">今日の練習はひととおり終わりました。</p>
            </>
          ) : resumeLabel ? (
            <>
              {/* Resuming is the likely intent, so it leads; starting over is
                  still one tap away. */}
              <Link className="button button--primary" to="/practice">
                つづきから（{resumeLabel}）
              </Link>
              <Link
                className="button button--ghost"
                to="/practice"
                onClick={onRestart}
              >
                はじめから
              </Link>
            </>
          ) : (
            <>
              <Link className="button button--primary" to="/practice">
                はじめる
              </Link>
              <p className="preview__note">
                途中でやめても、続きから再開できます。
              </p>
            </>
          )}
        </div>
      )}

      {/* Kept below the fold: the session is what the page is for, and these
          are here to glance at afterwards. */}
      <section className="rail__card today__record">
        <h2 className="rail__title">今週の記録</h2>
        <ol className="week">
          {week.map((day) => (
            <li
              key={day.label}
              className={[
                "week__day",
                day.done && "week__day--done",
                day.today && "week__day--today",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="week__label">{day.label}</span>
              <span className="week__dot" aria-hidden="true" />
            </li>
          ))}
        </ol>
        <p className="rail__note">最長 {streak.longest}日連続</p>
      </section>

      <section className="rail__card today__record">
        <h2 className="rail__title">復習</h2>
        {reviewCount > 0 ? (
          <>
            <p className="rail__big">{reviewCount}件</p>
            <p className="rail__note">つまずいたフレーズがあります。</p>
            <Link className="button button--ghost" to="/review">
              復習する
            </Link>
          </>
        ) : (
          <p className="rail__note">今のところ苦手はなし。いい調子。</p>
        )}
      </section>
    </main>
  );
}
