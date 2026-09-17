/**
 * Session, streak and review behaviour against a real database.
 * Skipped when no DATABASE_URL is configured, like the RLS tests.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { createDb } from "@vibe-english/db";
import {
  DAILY_TARGET,
  finishChunk,
  getDailySession,
  getReviewGroups,
} from "@vibe-english/domain";

const adminUrl =
  process.env.TEST_MIGRATION_DATABASE_URL ??
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;
const appUrl =
  process.env.TEST_APP_DATABASE_URL ??
  process.env.APP_DATABASE_URL ??
  process.env.DATABASE_URL;

const enabled = Boolean(adminUrl && appUrl);
const USER = "session-test-user";

describe.skipIf(!enabled)("daily session", () => {
  const admin = enabled ? new pg.Pool({ connectionString: adminUrl }) : null;
  const handle = enabled ? createDb(appUrl!) : null;

  beforeEach(async () => {
    await admin!.query("DELETE FROM user_drill_results WHERE user_id = $1", [USER]);
    await admin!.query("DELETE FROM user_streaks WHERE user_id = $1", [USER]);
    await admin!.query("DELETE FROM user_progress WHERE user_id = $1", [USER]);
    await admin!.query("DELETE FROM user_flags WHERE user_id = $1", [USER]);
  });

  afterAll(async () => {
    if (!enabled) return;
    await admin!.query("DELETE FROM user_drill_results WHERE user_id = $1", [USER]);
    await admin!.query("DELETE FROM user_streaks WHERE user_id = $1", [USER]);
    await admin!.query("DELETE FROM user_progress WHERE user_id = $1", [USER]);
    await admin!.end();
    await handle!.dispose();
  });

  it("serves a finite queue instead of the whole catalogue", async () => {
    const session = await getDailySession(handle!.db, USER);

    expect(session.total).toBe(DAILY_TARGET);
    expect(session.chunks).toHaveLength(DAILY_TARGET);
    expect(session.doneCount).toBe(0);
    expect(session.streak).toEqual({
      current: 0,
      longest: 0,
      practicedToday: false,
    });
  });

  it("counts today's completion and starts the streak", async () => {
    const { chunks } = await getDailySession(handle!.db, USER);
    const outcome = await finishChunk(
      handle!.db,
      USER,
      chunks[0].id,
      "got_it",
    );

    expect(outcome?.streak.current).toBe(1);
    // Regression: a Postgres `date` read as UTC lands on the previous day in
    // any timezone east of UTC, which made this false all day in JST.
    expect(outcome?.streak.practicedToday).toBe(true);

    const after = await getDailySession(handle!.db, USER);
    expect(after.doneCount).toBe(1);
    expect(after.streak.practicedToday).toBe(true);
  });

  it("does not inflate the streak when practising twice in one day", async () => {
    const { chunks } = await getDailySession(handle!.db, USER);

    await finishChunk(handle!.db, USER, chunks[0].id, "got_it");
    const second = await finishChunk(handle!.db, USER, chunks[1].id, "got_it");

    expect(second?.streak.current).toBe(1);
  });

  it("puts a struggled chunk into review and clears it once answered", async () => {
    const { chunks } = await getDailySession(handle!.db, USER);
    const target = chunks[0].id;

    await finishChunk(handle!.db, USER, target, "struggled");

    const groups = await getReviewGroups(handle!.db, USER);
    const struggled = groups.find((group) => group.key === "struggled");
    expect(struggled?.chunks.map((chunk) => chunk.id)).toContain(target);

    // Only the latest attempt counts, so getting it right retires it.
    await finishChunk(handle!.db, USER, target, "got_it");

    const after = await getReviewGroups(handle!.db, USER);
    const stillStruggled = after.find((group) => group.key === "struggled");
    expect(stillStruggled?.chunks.map((chunk) => chunk.id)).not.toContain(target);
  });

  it("keeps chunks completed today in the queue so it does not reshuffle", async () => {
    const before = await getDailySession(handle!.db, USER);
    const firstId = before.chunks[0].id;

    await finishChunk(handle!.db, USER, firstId, "got_it");

    const after = await getDailySession(handle!.db, USER);
    expect(after.chunks[0].id).toBe(firstId);
  });
});
