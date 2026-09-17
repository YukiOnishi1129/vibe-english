import { Link } from "react-router-dom";
import type { Chunk } from "@vibe-english/domain";

// Presentational only.

export type HardListViewPresenterProps = {
  chunks: Chunk[] | undefined;
  isLoading: boolean;
  errorMessage: string | null;
};

export function HardListViewPresenter({
  chunks,
  isLoading,
  errorMessage,
}: HardListViewPresenterProps) {
  return (
    <main className="screen">
      <header className="page-head">
        <h1 className="page-head__title">難しいリスト</h1>
      </header>

      {errorMessage && <p className="error">{errorMessage}</p>}
      {isLoading && <p className="muted">読み込み中…</p>}

      {chunks?.length === 0 && (
        <p className="muted">
          まだありません。練習中に「難しい」を押すとここに入ります。
        </p>
      )}

      <ul className="card-list">
        {chunks?.map((chunk) => (
          <li key={chunk.id}>
            <Link className="card" to={`/practice/${chunk.id}`}>
              <div className="card__main">
                <p className="card__phrase">{chunk.phrase}</p>
                <p className="card__meaning">{chunk.meaningJa}</p>
              </div>
              <span className="tag tag--hard">難しい</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
