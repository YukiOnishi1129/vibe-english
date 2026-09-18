import { useEffect, useRef } from "react";
import { Avatar } from "@/shared/components/Avatar";
import type { ThemeChoice } from "@/shared/hooks/useTheme";

const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "昼" },
  { value: "dark", label: "夜" },
  { value: "system", label: "自動" },
];

// Presentational only: props in, JSX out.

export type UserMenuPresenterProps = {
  userName: string;
  userImage: string | null;
  open: boolean;
  signingOut: boolean;
  errorMessage: string | null;
  theme: ThemeChoice;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
  onThemeChange: (theme: ThemeChoice) => void;
};

export function UserMenuPresenter({
  userName,
  userImage,
  open,
  signingOut,
  errorMessage,
  theme,
  onToggle,
  onClose,
  onSignOut,
  onThemeChange,
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

  return (
    <div className="usermenu" ref={rootRef}>
      <button
        type="button"
        className="usermenu__trigger"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={userImage} name={userName} className="usermenu__avatar" />
        <span className="usermenu__name">{userName}</span>
        <span className="usermenu__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="usermenu__popover" role="menu">
          <div className="themepick">
            <p className="themepick__label">見た目</p>
            <div className="themepick__options" role="group" aria-label="見た目">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`themepick__option ${
                    theme === option.value ? "themepick__option--on" : ""
                  }`}
                  onClick={() => onThemeChange(option.value)}
                  aria-pressed={theme === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
