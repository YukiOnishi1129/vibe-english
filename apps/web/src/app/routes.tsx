import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";
import { LoginView } from "@/features/auth/components/LoginView";
import { TodayView } from "@/features/chunks/components/TodayView";
import { PracticeSessionView } from "@/features/chunks/components/PracticeSessionView";
import { TestView } from "@/features/chunks/components/TestView";
import { ReviewView } from "@/features/chunks/components/ReviewView";
import { AppShell } from "@/shared/components/AppShell";

/** Routing only — no data fetching lives here. */
export function AppRoutes() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <div className="screen screen--center">
        <p className="muted">読み込み中…</p>
      </div>
    );
  }

  if (session.status === "anonymous") {
    // Every route falls back to login until a session exists.
    return (
      <Routes>
        <Route path="*" element={<LoginView />} />
      </Routes>
    );
  }

  return (
    <AppShell user={session.user}>
      <Routes>
        <Route path="/" element={<TodayView />} />
        <Route path="/practice" element={<PracticeSessionView />} />
        <Route path="/test" element={<TestView />} />
        <Route path="/review" element={<ReviewView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
