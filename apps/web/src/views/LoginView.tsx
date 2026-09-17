import { useState } from "react";
import { api } from "../api";

export function LoginView() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Better Auth returns the provider URL from a POST; the browser then
  // navigates there for the consent screen.
  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      window.location.href = await api.startGoogleSignIn("/");
    } catch {
      setError("ログインを開始できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  };

  return (
    <main className="screen screen--center">
      <div className="login">
        <p className="login__badge">Vibe English</p>
        <h1 className="login__title">
          英語を、勉強じゃなく
          <br />
          毎日のノリに。
        </h1>
        <p className="muted login__lead">
          短いフレーズを、聞いて・まねて・書いて。1日3分から。
        </p>

        <button
          type="button"
          className="button button--primary"
          onClick={signIn}
          disabled={busy}
        >
          {busy ? "接続中…" : "Google でログイン"}
        </button>

        {error && <p className="error">{error}</p>}

        <p className="login__note">ログインすると練習の記録が保存されます。</p>
      </div>
    </main>
  );
}
