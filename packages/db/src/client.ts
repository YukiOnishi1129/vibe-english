import { Kysely, PostgresDialect } from "kysely";
import {
  Pool as NeonPool,
  neonConfig,
  type Pool as NeonPoolType,
} from "@neondatabase/serverless";
import { Pool as TcpPool } from "pg";
import type { DB } from "./generated";

// Neon tunnels Postgres over a WebSocket, which is how the Worker reaches the
// database without raw TCP. We use Pool (not the stateless HTTP driver) because
// RLS needs a real session: set_config('app.user_id', ..., true) and the
// queries relying on it must share one transaction on one connection.
neonConfig.webSocketConstructor = WebSocket;
neonConfig.poolQueryViaFetch = false;

export type AppDatabase = Kysely<DB>;

/**
 * Better Auth accepts any node-postgres-compatible pool. Both the Neon pool and
 * the local `pg` pool satisfy the parts it uses, but their types differ, so the
 * handle exposes the shape Better Auth needs.
 */
export type AuthPool = NeonPoolType;

export type DbHandle = {
  db: AppDatabase;
  /** Same pool the Kysely instance uses; handed to Better Auth's adapter. */
  pool: AuthPool;
  dispose: () => Promise<void>;
};

function isNeonHost(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

/**
 * Builds a Kysely instance (and its pool) for one request.
 *
 * Production points at Neon and uses its WebSocket driver. Local development
 * may point at a plain Postgres, which speaks no WebSocket; there we fall back
 * to node-postgres over TCP (available under nodejs_compat). Both paths yield
 * the same Kysely API, so nothing above this file changes.
 *
 * Workers forbid reusing I/O objects across requests, so a module-level
 * singleton pool would break; creating the pool per request keeps each
 * connection inside the request that opened it.
 */
export function createDb(connectionString: string): DbHandle {
  const pool = isNeonHost(connectionString)
    ? new NeonPool({ connectionString, max: 1 })
    : createLocalPool(connectionString);

  const db = new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });

  return {
    db,
    pool: pool as AuthPool,
    dispose: async () => {
      // Destroying Kysely ends the underlying pool too.
      await db.destroy();
    },
  };
}

/** node-postgres over TCP, for local (non-Neon) Postgres. */
function createLocalPool(connectionString: string): AuthPool {
  return new TcpPool({ connectionString, max: 1 }) as unknown as AuthPool;
}
