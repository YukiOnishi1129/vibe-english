import { useCallback, useState } from "react";
import type { Me } from "@vibe-english/domain";
import { useSignOut } from "@/features/auth/hooks/useSession";
import { UserMenuPresenter } from "./UserMenuPresenter";

export function UserMenuContainer({ user }: { user: Me }) {
  const [open, setOpen] = useState(false);
  const { signOut, signingOut, failed } = useSignOut();

  const close = useCallback(() => setOpen(false), []);

  return (
    <UserMenuPresenter
      userName={user.name}
      userImage={user.image}
      open={open}
      signingOut={signingOut}
      errorMessage={failed ? "ログアウトできませんでした。" : null}
      onToggle={() => setOpen((v) => !v)}
      onClose={close}
      onSignOut={signOut}
    />
  );
}
