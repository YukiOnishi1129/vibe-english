// Presentational only: props in, JSX out.

export type LoginViewPresenterProps = {
  busy: boolean;
  failed: boolean;
  onSignIn: () => void;
};

export function LoginViewPresenter({
  busy,
  failed,
  onSignIn,
}: LoginViewPresenterProps) {
  return (
    <main className="screen screen--center">
      <div className="login">
        <div className="login__hero">
          <p className="login__badge">ゆる英語</p>
          <h1 className="login__title">
            ゆるく続けられる
            <br />
            英語。
          </h1>
        </div>

        <div className="login__panel">
          <p className="login__lead">
            短いフレーズを、聞いて・まねて・書いて。1日3分から。
          </p>

        <button
          type="button"
          className="button button--primary"
          onClick={onSignIn}
          disabled={busy}
        >
          {busy ? "接続中…" : "Google でログイン"}
        </button>

        {failed && (
          <p className="error">
            ログインを開始できませんでした。もう一度お試しください。
          </p>
        )}

          <p className="login__note">
            ログインすると練習の記録が保存されます。
          </p>
        </div>
      </div>
    </main>
  );
}
