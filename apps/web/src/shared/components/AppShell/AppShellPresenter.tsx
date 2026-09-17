import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { Me } from "@vibe-english/domain";
import { UserMenu } from "@/shared/components/UserMenu";

// Presentational only: props in, JSX out.

export type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export type AppShellPresenterProps = {
  user: Me;
  navItems: readonly NavItem[];
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  children: ReactNode;
};

export function AppShellPresenter({
  user,
  navItems,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  children,
}: AppShellPresenterProps) {
  return (
    <div className={`shell ${menuOpen ? "shell--menu-open" : ""}`}>
      {/* Mobile-only bar: the sidebar is off-canvas at narrow widths. */}
      <header className="shell__topbar">
        <button
          type="button"
          className="shell__burger"
          onClick={onOpenMenu}
          aria-label="メニューを開く"
          aria-expanded={menuOpen}
        >
          ☰
        </button>
        <span className="shell__brand">Vibe English</span>
      </header>

      <button
        type="button"
        className="shell__scrim"
        onClick={onCloseMenu}
        aria-label="メニューを閉じる"
        tabIndex={menuOpen ? 0 : -1}
      />

      <aside className="shell__sidebar">
        <div className="shell__sidebar-head">
          <p className="shell__badge">Vibe English</p>
          <p className="shell__tagline">英語を、毎日のノリに。</p>
        </div>

        <nav className="shell__nav" aria-label="メインナビゲーション">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `shell__navlink ${isActive ? "shell__navlink--active" : ""}`
              }
              onClick={onCloseMenu}
            >
              <span className="shell__navicon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shell__sidebar-foot">
          <UserMenu user={user} />
        </div>
      </aside>

      <main className="shell__main">{children}</main>
    </div>
  );
}
