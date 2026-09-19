/**
 * Practice history is counted in the learner's own timezone, which is easy to
 * get wrong and invisible until someone studies late at night.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { createDb } from "@vibe-english/db";
import { getPracticeHistory } from "@vibe-english/domain";

const adminUrl =
  process.env.TEST_MIGRATION_DATABASE_URL ??
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL;
const appUrl =
  process.env.TEST_APP_DATABASE_URL ??
  process.env.APP_DATABASE_URL ??
  process.env.DATABASE_URL;

const enabled = Boolean(adminUrl && appUrl);
const USER = "history-spec-user";
const JST = 9 * 60;

describe.skipIf(!enabled)("practice history", () => {
  const admin = enabled ? new pg.Pool({ connectionString: adminUrl }) : null;
  const handle = enabled ? createDb(appUrl!) : null;

  async function record(at: string, chunkId = "can-i-get") {
    await admin!.query(
      `INSERT INTO user_drill_results (id, user_id, chunk_id, result, created_at)
       VALUES ($1, $2, $3, 'got_it', $4)`,
      [`${USER}:${at}:${chunkId}`, USER, chunkId, at],
    );
  }

  beforeEach(async () => {
    await admin!.query("DELETE FROM user_drill_results WHERE user_id = $1", [
      USER,
    ]);
  });

  afterAll(async () => {
    if (!enabled) return;
    await admin!.query("DELETE FROM user_drill_results WHERE user_id = $1", [
      USER,
    ]);
    await admin!.end();
    await handle!.dispose();
  });

  it("reports nothing when the learner has not practised", async () => {
    expect(await getPracticeHistory(handle!.db, USER, JST)).toEqual([]);
  });

  it("counts answers per day", async () => {
    await record("2026-09-10T03:00:00Z");
    await record("2026-09-10T04:00:00Z", "im-good");

    const days = await getPracticeHistory(handle!.db, USER, JST);
    expect(days).toEqual([{ day: "2026-09-10", answers: 2 }]);
  });

  it("uses the learner's timezone, not the server's", async () => {
    // 22:30 UTC is already the next morning in Japan.
    await record("2026-09-10T22:30:00Z");

    const jst = await getPracticeHistory(handle!.db, USER, JST);
    const utc = await getPracticeHistory(handle!.db, USER, 0);

    expect(jst[0].day).toBe("2026-09-11");
    expect(utc[0].day).toBe("2026-09-10");
  });

  it("returns the most recent day first", async () => {
    await record("2026-09-10T03:00:00Z");
    await record("2026-09-12T03:00:00Z", "im-good");

    const days = await getPracticeHistory(handle!.db, USER, JST);
    expect(days.map((entry) => entry.day)).toEqual([
      "2026-09-12",
      "2026-09-10",
    ]);
  });
});
