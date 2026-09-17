import { Link } from "react-router-dom";
import type { Chunk, Streak } from "@vibe-english/domain";

/**
 * Inline SVG rather than emoji or text glyphs: a glyph sits on its baseline,
 * so it lands off-centre inside a circle no matter how the box is aligned.
 * A viewBox-centred path is centred by construction.
 */
function NodeIcon({ kind }: { kind: "done" | "review" | "todo" }) {
  const paths = {
    done: "M5 12.5l4.5 4.5L19 7.5",
    review: "M4 9h11a4 4 0 010 8h-7m0 0l3-3m-3 3l3 3",
    todo: "M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z",
  } as const;

  return (
    <svg
      className="path__icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={kind === "todo" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={kind === "todo" ? 0 : 2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[kind]} />
    </svg>
  );
}

// Presentational only: props in, JSX out.

export type PathNode = {
  chunk: Chunk;
  done: boolean;
  /** The one the learner should tap next. */
  current: boolean;
};

export type WeekDay = {
  label: string;
  done: boolean;
  today: boolean;
};

export type TodayViewPresenterProps = {
  nodes: PathNode[];
  doneCount: number;
  total: number;
  streak: Streak;
  allDone: boolean;
  week: WeekDay[];
  reviewCount: number;
  isLoading: boolean;
  errorMessage: string | null;
};

export function TodayViewPresenter({
  nodes,
  doneCount,
  total,
  streak,
  allDone,
  week,
  reviewCount,
  isLoading,
  errorMessage,
}: TodayViewPresenterProps) {
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="today">
      <main className="today__main">
      {/* Coloured banner, so the page opens with something other than text. */}
      <header className="banner">
        <div>
          <p className="banner__eyebrow">今日のレッスン</p>
          <h1 className="banner__title">
            {allDone ? "今日はコンプリート！" : `${total}フレーズ、3分で`}
          </h1>
        </div>
        <span className="banner__streak" title="連続日数">
          🔥 <strong>{streak.current}</strong>
        </span>
      </header>

      <div className="hud">
        <div
          className="hud__bar"
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <span className="hud__fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="hud__progress">
          {doneCount}/{total}
        </span>
      </div>

      {errorMessage && <p className="error">{errorMessage}</p>}
      {isLoading && <p className="muted">読み込み中…</p>}

      {allDone && (
        <section className="finished">
          <p className="finished__emoji" aria-hidden="true">
            🎉
          </p>
          <h1 className="finished__title">今日はここまで！</h1>
          <p className="muted">
            {streak.current}日連続。明日もこの調子で。
          </p>
          <Link className="button button--ghost" to="/review">
            復習する
          </Link>
        </section>
      )}

      {!allDone && nodes.length > 0 && (
        <p className="muted">上から順に、サッと1本ずつ。</p>
      )}

      {/* A short vertical path: one node per chunk, finite by design. */}
      <ol className="path">
        {nodes.map((node) => (
          <li
            key={node.chunk.id}
            className={[
              "path__step",
              node.done && "path__step--done",
              node.current && "path__step--current",
              node.chunk.needsReview && "path__step--review",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Link
              className="path__node"
              to={`/practice/${node.chunk.id}`}
              aria-current={node.current ? "step" : undefined}
            >
              <NodeIcon
                kind={
                  node.done ? "done" : node.chunk.needsReview ? "review" : "todo"
                }
              />
              <span className="visually-hidden">
                {node.done ? "完了" : "未完了"}
              </span>
            </Link>

            <div className="path__label">
              <p className="path__phrase">{node.chunk.phrase}</p>
              {node.current && <p className="path__cta">タップして練習</p>}
            </div>
          </li>
        ))}
      </ol>
      </main>

      {/* Side rail: gives the wide layout something to hold and surfaces the
          two things worth knowing between sessions. */}
      <aside className="rail">
        <section className="rail__card">
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
          <p className="rail__note">
            最長 {streak.longest}日連続
          </p>
        </section>

        <section className="rail__card">
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
      </aside>
    </div>
  );
}
