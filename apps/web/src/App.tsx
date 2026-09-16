import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./useSession";
import { LoginView } from "./views/LoginView";
import { TodayView } from "./views/TodayView";
import { PracticeView } from "./views/PracticeView";
import { HardListView } from "./views/HardListView";

export function App() {
  const { state } = useSession();

  if (state.status === "loading") {
    return (
      <div className="screen screen--center">
        <p className="muted">読み込み中…</p>
      </div>
    );
  }

  if (state.status === "anonymous") {
    // Every route falls back to login until a session exists.
    return (
      <Routes>
        <Route path="*" element={<LoginView />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<TodayView user={state.user} />} />
      <Route path="/practice/:chunkId" element={<PracticeView />} />
      <Route path="/hard" element={<HardListView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
