import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Chunk } from "@vibe-english/domain";
import { api } from "../api";

export function HardListView() {
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getHardChunks()
      .then(setChunks)
      .catch(() => setError("読み込みに失敗しました。"));
  }, []);

  return (
    <main className="screen">
      <header className="header">
        <div>
          <p className="header__badge">Vibe English</p>
          <h1 className="header__title">難しいリスト</h1>
        </div>
        <Link className="header__link" to="/">
          今日へ
        </Link>
      </header>

      {error && <p className="error">{error}</p>}
      {!chunks && !error && <p className="muted">読み込み中…</p>}

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
