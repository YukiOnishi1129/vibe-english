import { Hono } from "hono";
import {
  chooseCourse,
  getCourseDetail,
  getCourses,
} from "@vibe-english/domain";
import type { AppContext } from "../context";
import { requireAuth } from "../middleware/auth";

export const courseRoutes = new Hono<AppContext>()
  .use("*", requireAuth)

  .get("/", async (c) => {
    const courses = await getCourses(c.get("db"), c.get("user").id);
    return c.json({ courses });
  })

  // The full curriculum, opened deliberately rather than shown by default.
  .get("/:id", async (c) => {
    const course = await getCourseDetail(
      c.get("db"),
      c.get("user").id,
      c.req.param("id"),
    );
    if (!course) return c.json({ error: "not_found" }, 404);
    return c.json(course);
  })

  .post("/:id/select", async (c) => {
    const ok = await chooseCourse(
      c.get("db"),
      c.get("user").id,
      c.req.param("id"),
    );
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ selected: c.req.param("id") });
  });
