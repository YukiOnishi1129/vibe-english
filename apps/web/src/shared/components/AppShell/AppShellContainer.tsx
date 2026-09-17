import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { Me } from "@vibe-english/domain";
import { AppShellPresenter, type NavItem } from "./AppShellPresenter";

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "今日のレッスン", icon: "🔥" },
  { to: "/review", label: "復習", icon: "🔁" },
];

export function AppShellContainer({
  user,
  children,
}: {
  user: Me;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Navigating on mobile should leave the drawer closed.
  useEffect(() => setMenuOpen(false), [pathname]);

  const open = useCallback(() => setMenuOpen(true), []);
  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <AppShellPresenter
      user={user}
      navItems={NAV_ITEMS}
      menuOpen={menuOpen}
      onOpenMenu={open}
      onCloseMenu={close}
    >
      {children}
    </AppShellPresenter>
  );
}
