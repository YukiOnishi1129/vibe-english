import { Hono } from "hono";
import { getPracticeHistory } from "@vibe-english/domain";
import type { AppContext } from "../context";
import { requireAuth } from "../middleware/auth";

export const meRoutes = new Hono<AppContext>()
  .get("/", requireAuth, (c) => c.json(c.get("user")))

  // Which days the learner practised, for the calendar. The client sends its
  // UTC offset so the days line up with its own clock.
  .get("/history", requireAuth, async (c) => {
    const raw = Number(c.req.query("offset"));
    // Guard against a nonsense offset; real ones sit within +/- 14 hours.
    const offsetMinutes =
      Number.isFinite(raw) && Math.abs(raw) <= 14 * 60 ? raw : 0;

    const days = await getPracticeHistory(
      c.get("db"),
      c.get("user").id,
      offsetMinutes,
    );
    return c.json({ days });
  });
