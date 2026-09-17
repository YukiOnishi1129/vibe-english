import { Link } from "react-router-dom";
import type { Chunk } from "@vibe-english/domain";

// Presentational only: props in, JSX out. No data fetching, no effects.

export type TodayViewPresenterProps = {
  userName: string;
  chunks: Chunk[] | undefined;
  doneCount: number;
  isLoading: boolean;
  errorMessage: string | null;
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
}: TodayViewPresenterProps) {
  return (
    <main className="screen">
      <header className="page-head">
        <h1 className="page-head__title">今日のフレーズ</h1>
        <p className="muted">
          {userName} さん — {chunks ? `${doneCount}/${chunks.length} 完了` : "…"}
        </p>
      </header>

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
