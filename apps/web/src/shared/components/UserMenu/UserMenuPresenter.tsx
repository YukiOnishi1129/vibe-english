import { useEffect, useRef } from "react";

// Presentational only: props in, JSX out.

export type UserMenuPresenterProps = {
  userName: string;
  userImage: string | null;
  open: boolean;
  signingOut: boolean;
  errorMessage: string | null;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
};

export function UserMenuPresenter({
  userName,
  userImage,
  open,
  signingOut,
  errorMessage,
  onToggle,
  onClose,
  onSignOut,
}: UserMenuPresenterProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Clicking elsewhere or pressing Escape dismisses the menu.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const initial = userName.trim().charAt(0) || "?";

  return (
    <div className="usermenu" ref={rootRef}>
      <button
        type="button"
        className="usermenu__trigger"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {userImage ? (
          <img className="usermenu__avatar" src={userImage} alt="" />
        ) : (
          <span className="usermenu__avatar usermenu__avatar--fallback">
            {initial}
          </span>
        )}
        <span className="usermenu__name">{userName}</span>
        <span className="usermenu__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="usermenu__popover" role="menu">
          <button
            type="button"
            className="usermenu__item"
            role="menuitem"
            onClick={onSignOut}
            disabled={signingOut}
          >
            {signingOut ? "ログアウト中…" : "ログアウト"}
          </button>
          {errorMessage && (
            <p className="usermenu__error">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
