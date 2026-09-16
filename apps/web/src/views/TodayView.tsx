import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Chunk, Me } from "@vibe-english/domain";
import { api } from "../api";

function isCompleted(chunk: Chunk) {
  return (chunk.progress?.completedCount ?? 0) > 0;
}

export function TodayView({ user }: { user: Me }) {
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTodayChunks()
      .then(setChunks)
      .catch(() => setError("読み込みに失敗しました。"));
  }, []);

  const doneCount = chunks?.filter(isCompleted).length ?? 0;

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

      <p className="muted">
        {user.name} さん — {chunks ? `${doneCount}/${chunks.length} 完了` : "…"}
      </p>

      {error && <p className="error">{error}</p>}
      {!chunks && !error && <p className="muted">読み込み中…</p>}

      <ul className="card-list">
        {chunks?.map((chunk) => (
          <li key={chunk.id}>
            <Link className="card" to={`/practice/${chunk.id}`}>
              <div className="card__main">
                <p className="card__phrase">{chunk.phrase}</p>
                <p className="card__meaning">{chunk.meaningJa}</p>
              </div>
              <div className="card__tags">
                {isCompleted(chunk) && <span className="tag tag--done">完了</span>}
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
