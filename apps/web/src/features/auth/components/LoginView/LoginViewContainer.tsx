import { useGoogleSignIn } from "@/features/auth/hooks/useSession";
import { LoginViewPresenter } from "./LoginViewPresenter";

export function LoginViewContainer() {
  const { signIn, busy, failed } = useGoogleSignIn();

  return <LoginViewPresenter busy={busy} failed={failed} onSignIn={signIn} />;
}
