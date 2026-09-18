import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "@/features/auth/hooks/useSession";
import { LoginView } from "@/features/auth/components/LoginView";
import { TodayView } from "@/features/chunks/components/TodayView";
import { PracticeView } from "@/features/chunks/components/PracticeView";
import { ReviewView } from "@/features/chunks/components/ReviewView";
import { QuizView } from "@/features/chunks/components/QuizView";
import { LabIntroView } from "@/features/lab/components/LabIntroView";
import { LabView } from "@/features/lab/components/LabView";
import { LabTestView } from "@/features/lab/components/LabTestView";
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
        <Route path="/practice/:chunkId" element={<PracticeView />} />
        <Route path="/review" element={<ReviewView />} />
        <Route path="/quiz" element={<QuizView />} />

        {/* Alternative lesson shape, reachable by URL only while the two are
            being compared. */}
        <Route path="/lab" element={<LabIntroView />} />
        <Route path="/lab/practice" element={<LabView />} />
        <Route path="/lab/test" element={<LabTestView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
