import type { Trx } from "../withUserTransaction";

// courses / course_units are public content; user_courses is RLS-protected.

export async function listCourses(trx: Trx) {
  return trx
    .selectFrom("courses")
    .select(["id", "title", "description", "sort_order"])
    .where("is_active", "=", true)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();
}

export async function findCourseById(trx: Trx, courseId: string) {
  return trx
    .selectFrom("courses")
    .select(["id", "title", "description", "sort_order"])
    .where("id", "=", courseId)
    .where("is_active", "=", true)
    .executeTakeFirst();
}

export async function listUnitsForCourse(trx: Trx, courseId: string) {
  return trx
    .selectFrom("course_units")
    .select(["id", "course_id", "title", "description", "sort_order"])
    .where("course_id", "=", courseId)
    .orderBy("sort_order", "asc")
    .execute();
}

/** Chunks in a course, ordered so the curriculum reads top to bottom. */
export async function listChunksForCourse(trx: Trx, courseId: string) {
  return trx
    .selectFrom("chunks")
    .innerJoin("course_units", "course_units.id", "chunks.unit_id")
    .select([
      "chunks.id",
      "chunks.phrase",
      "chunks.meaning_ja",
      "chunks.situation",
      "chunks.nuance",
      "chunks.level",
      "chunks.sort_order",
      "chunks.unit_id",
    ])
    .where("course_units.course_id", "=", courseId)
    .where("chunks.is_active", "=", true)
    .orderBy("course_units.sort_order", "asc")
    .orderBy("chunks.sort_order", "asc")
    .execute();
}

export async function findSelectedCourse(trx: Trx, userId: string) {
  return trx
    .selectFrom("user_courses")
    .select(["course_id", "started_at"])
    .where("user_id", "=", userId)
    .executeTakeFirst();
}

/** Switching courses replaces the selection; progress lives on the chunks. */
export async function selectCourse(
  trx: Trx,
  userId: string,
  courseId: string,
) {
  await trx
    .insertInto("user_courses")
    .values({ user_id: userId, course_id: courseId })
    .onConflict((oc) =>
      oc.column("user_id").doUpdateSet({
        course_id: courseId,
        updated_at: new Date(),
      }),
    )
    .execute();
}
