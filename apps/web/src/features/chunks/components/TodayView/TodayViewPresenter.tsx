import { Link } from "react-router-dom";
import type { Chunk } from "@vibe-english/domain";

// Presentational only: props in, JSX out. No data fetching, no effects.

export type TodayViewPresenterProps = {
  userName: string;
  chunks: Chunk[] | undefined;
  doneCount: number;
  isLoading: boolean;
  errorMessage: string | null;
  signingOut: boolean;
  onSignOut: () => void;
};

function isCompleted(chunk: Chunk) {
  return (chunk.progress?.completedCount ?? 0) > 0;
}

export function TodayViewPresenter({
  userName,
  chunks,
  doneCount,
  isLoading,
  errorMessage,
  signingOut,
  onSignOut,
}: TodayViewPresenterProps) {
  return (
    <main className="screen">
      <header className="header">
        <div>
          <p className="header__badge">Vibe English</p>
          <h1 className="header__title">今日のフレーズ</h1>
        </div>
        <Link className="header__link" to="/hard">
          難しいリスト
        </Link>
      </header>

      <div className="header__row">
        <p className="muted">
          {userName} さん — {chunks ? `${doneCount}/${chunks.length} 完了` : "…"}
        </p>
        <button
          type="button"
          className="linkish"
          disabled={signingOut}
          onClick={onSignOut}
        >
          {signingOut ? "…" : "ログアウト"}
        </button>
      </div>

      {errorMessage && <p className="error">{errorMessage}</p>}
      {isLoading && <p className="muted">読み込み中…</p>}

      <ul className="card-list">
        {chunks?.map((chunk) => (
          <li key={chunk.id}>
            <Link className="card" to={`/practice/${chunk.id}`}>
              <div className="card__main">
                <p className="card__phrase">{chunk.phrase}</p>
                <p className="card__meaning">{chunk.meaningJa}</p>
              </div>
              <div className="card__tags">
                {isCompleted(chunk) && (
                  <span className="tag tag--done">完了</span>
                )}
                {chunk.isHard && <span className="tag tag--hard">難しい</span>}
                {chunk.level && <span className="tag">{chunk.level}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {chunks?.length === 0 && (
        <p className="muted">フレーズがまだありません。</p>
      )}
    </main>
  );
}
