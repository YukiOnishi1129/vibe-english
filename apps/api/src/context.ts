import type { AppDatabase } from "@vibe-english/db";
import type { Me } from "@vibe-english/domain";
import type { Auth } from "./auth";
import type { Env } from "./env";

/** Hono generics shared by every route and middleware in this app. */
export type AppContext = {
  Bindings: Env;
  Variables: {
    db: AppDatabase;
    auth: Auth;
    /** Set by requireAuth; present only on protected routes. */
    user: Me;
  };
};
