/**
 * Verifies that RLS actually isolates per-user rows.
 *
 * Runs against the DATABASE_URL Postgres (CI service container, or a local
 * container — see README). Skipped when TEST_DATABASE_URL/DATABASE_URL is
 * unset so `npm test` still works without a database.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

const adminUrl =
  process.env.TEST_MIGRATION_DATABASE_URL ??
  process.env.MIGRATION_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

const appUrl =
  process.env.TEST_APP_DATABASE_URL ??
  process.env.APP_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

const enabled = Boolean(adminUrl && appUrl);

describe.skipIf(!enabled)("row level security", () => {
  let admin: pg.Pool;
  let app: pg.Pool;

  const USER_A = "rls-test-user-a";
  const USER_B = "rls-test-user-b";
  let chunkId: string;

  /** Runs queries in one transaction with app.user_id set, as the app does. */
  async function asUser<T>(
    userId: string,
    fn: (client: pg.PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await app.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  beforeAll(async () => {
    admin = new pg.Pool({ connectionString: adminUrl });
    app = new pg.Pool({ connectionString: appUrl });

    const { rows } = await admin.query<{ id: string }>(
      "SELECT id FROM chunks ORDER BY sort_order LIMIT 1",
    );
    if (rows.length === 0) {
      throw new Error("no chunks found — run `npm run db:seed` first");
    }
    chunkId = rows[0].id;

    for (const id of [USER_A, USER_B]) {
      await admin.query(
        `INSERT INTO "user" (id, name, email) VALUES ($1, $1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [id, `${id}@example.test`],
      );
    }

    await admin.query("DELETE FROM user_progress WHERE user_id = ANY($1)", [
      [USER_A, USER_B],
    ]);
    await admin.query("DELETE FROM user_flags WHERE user_id = ANY($1)", [
      [USER_A, USER_B],
    ]);
  });

  afterAll(async () => {
    if (!enabled) return;
    await admin.query("DELETE FROM user_progress WHERE user_id = ANY($1)", [
      [USER_A, USER_B],
    ]);
    await admin.query("DELETE FROM user_flags WHERE user_id = ANY($1)", [
      [USER_A, USER_B],
    ]);
    await admin.query('DELETE FROM "user" WHERE id = ANY($1)', [
      [USER_A, USER_B],
    ]);
    await admin.end();
    await app.end();
  });

  it("connects as a role that cannot bypass RLS", async () => {
    const { rows } = await app.query<{
      rolbypassrls: boolean;
      rolsuper: boolean;
    }>("SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = current_user");

    expect(rows[0].rolbypassrls).toBe(false);
    expect(rows[0].rolsuper).toBe(false);
  });

  it("hides every row when app.user_id is not set", async () => {
    const progress = await app.query("SELECT * FROM user_progress");
    const flags = await app.query("SELECT * FROM user_flags");

    expect(progress.rowCount).toBe(0);
    expect(flags.rowCount).toBe(0);
  });

  it("shows a user only their own progress", async () => {
    await asUser(USER_A, (client) =>
      client.query(
        `INSERT INTO user_progress (user_id, chunk_id, seen_count, completed_count)
         VALUES ($1, $2, 1, 1)`,
        [USER_A, chunkId],
      ),
    );

    const seenByA = await asUser(USER_A, (client) =>
      client.query("SELECT user_id FROM user_progress"),
    );
    const seenByB = await asUser(USER_B, (client) =>
      client.query("SELECT user_id FROM user_progress"),
    );

    expect(seenByA.rows).toEqual([{ user_id: USER_A }]);
    expect(seenByB.rowCount).toBe(0);
  });

  it("refuses to write a row owned by another user", async () => {
    await expect(
      asUser(USER_A, (client) =>
        client.query(
          `INSERT INTO user_progress (user_id, chunk_id, seen_count, completed_count)
           VALUES ($1, $2, 1, 1)`,
          [USER_B, chunkId],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);

    const { rows } = await admin.query(
      "SELECT count(*)::int AS count FROM user_progress WHERE user_id = $1",
      [USER_B],
    );
    expect(rows[0].count).toBe(0);
  });

  it("scopes hard flags to their owner", async () => {
    await asUser(USER_B, (client) =>
      client.query(
        `INSERT INTO user_flags (user_id, chunk_id, flag) VALUES ($1, $2, 'hard')`,
        [USER_B, chunkId],
      ),
    );

    const seenByB = await asUser(USER_B, (client) =>
      client.query("SELECT chunk_id FROM user_flags"),
    );
    const seenByA = await asUser(USER_A, (client) =>
      client.query("SELECT chunk_id FROM user_flags"),
    );

    expect(seenByB.rows).toEqual([{ chunk_id: chunkId }]);
    expect(seenByA.rowCount).toBe(0);
  });

  it("cannot delete another user's flag", async () => {
    const deleted = await asUser(USER_A, (client) =>
      client.query("DELETE FROM user_flags WHERE chunk_id = $1", [chunkId]),
    );
    expect(deleted.rowCount).toBe(0);

    const { rows } = await admin.query(
      "SELECT count(*)::int AS count FROM user_flags WHERE user_id = $1",
      [USER_B],
    );
    expect(rows[0].count).toBe(1);
  });

  it("does not leak app.user_id across transactions on a pooled connection", async () => {
    await asUser(USER_A, async (client) => {
      await client.query("SELECT 1");
    });

    // A later query with no explicit setting must see nothing.
    const { rows } = await app.query<{ setting: string | null }>(
      "SELECT current_setting('app.user_id', true) AS setting",
    );
    expect(rows[0].setting === null || rows[0].setting === "").toBe(true);
  });
});
