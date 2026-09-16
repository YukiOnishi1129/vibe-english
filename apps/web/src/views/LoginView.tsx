import { api } from "../api";

export function LoginView() {
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

        <a className="button button--primary" href={api.googleSignInUrl("/")}>
          Google でログイン
        </a>

        <p className="login__note">ログインすると練習の記録が保存されます。</p>
      </div>
    </main>
  );
}
