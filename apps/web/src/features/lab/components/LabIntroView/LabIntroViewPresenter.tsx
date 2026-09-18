import { Link } from "react-router-dom";
import type { Chunk } from "@vibe-english/domain";

// Presentational only: props in, JSX out.

export type LabIntroViewPresenterProps = {
  chunks: Chunk[];
  isLoading: boolean;
  errorMessage: string | null;
  /** Where the learner left off today, if anywhere. */
  resumeLabel: string | null;
  onSpeak: (text: string) => void;
  onRestart: () => void;
};

export function LabIntroViewPresenter({
  chunks,
  isLoading,
  errorMessage,
  resumeLabel,
  onSpeak,
  onRestart,
}: LabIntroViewPresenterProps) {
  return (
    <main className="screen">
      <header className="page-head">
        <h1 className="page-head__title">今日のフレーズ</h1>
        <p className="muted">
          この{chunks.length}つを、意味 → 発音 → 穴埋め → 話す の順に。
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
          {resumeLabel ? (
            <>
              {/* Resuming is the likely intent, so it leads; starting over is
                  still one tap away. */}
              <Link className="button button--primary" to="/lab/practice">
                つづきから（{resumeLabel}）
              </Link>
              <Link
                className="button button--ghost"
                to="/lab/practice"
                onClick={onRestart}
              >
                はじめから
              </Link>
            </>
          ) : (
            <>
              <Link className="button button--primary" to="/lab/practice">
                はじめる
              </Link>
              <p className="preview__note">
                途中でやめても、続きから再開できます。
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
