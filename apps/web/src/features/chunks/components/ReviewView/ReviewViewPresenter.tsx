import { Link } from "react-router-dom";
import type { ReviewGroup } from "@vibe-english/domain";

// Presentational only.

export type ReviewViewPresenterProps = {
  groups: ReviewGroup[];
  isLoading: boolean;
  errorMessage: string | null;
};

const GROUP_EMOJI: Record<string, string> = {
  struggled: "🔁",
  hard: "🔖",
};

export function ReviewViewPresenter({
  groups,
  isLoading,
  errorMessage,
}: ReviewViewPresenterProps) {
  const empty = groups.every((group) => group.chunks.length === 0);

  return (
    <main className="screen">
      <header className="page-head">
        <h1 className="page-head__title">復習</h1>
        <p className="muted">
          つまずいたフレーズと、ブックマークしたフレーズ。
        </p>
      </header>

      {errorMessage && <p className="error">{errorMessage}</p>}
      {isLoading && <p className="muted">読み込み中…</p>}

      {!isLoading && empty && (
        <p className="muted">
          まだありません。問題を間違えるか、ブックマークするとここに入ります。
        </p>
      )}

      {groups.map((group) =>
        group.chunks.length === 0 ? null : (
          <section key={group.key} className="review-group">
            <h2 className="review-group__title">
              <span aria-hidden="true">{GROUP_EMOJI[group.key] ?? "•"}</span>{" "}
              {group.label}
              <span className="review-group__count">
                {group.chunks.length}
              </span>
            </h2>

            <ul className="card-list">
              {group.chunks.map((chunk) => (
                <li key={chunk.id}>
                  <Link className="card" to={`/practice/${chunk.id}`}>
                    <div className="card__main">
                      <p className="card__phrase">{chunk.phrase}</p>
                      <p className="card__meaning">{chunk.meaningJa}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </main>
  );
}
