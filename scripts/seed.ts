/**
 * Seeds content/chunks/*.md into the database. Idempotent: re-running upserts
 * the same rows and prunes children that disappeared from the Markdown.
 *
 * Runs over plain `pg` (not the Worker's Neon driver) and connects with
 * MIGRATION_DATABASE_URL, since seeding writes content tables as the owner.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "dotenv";
import {
  loadChunksFromDir,
  loadCoursesFromDir,
  exampleId,
  drillId,
  type ParsedChunk,
  type ParsedCourse,
} from "@vibe-english/content";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

config({ path: path.join(rootDir, ".env.local"), quiet: true });
config({ path: path.join(rootDir, ".env"), quiet: true });

const connectionString =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "MIGRATION_DATABASE_URL (or DATABASE_URL) must be set. See .env.example.",
  );
  process.exit(1);
}

async function seedCourse(client: pg.PoolClient, course: ParsedCourse) {
  await client.query(
    `INSERT INTO courses (id, title, description, sort_order, is_active, updated_at)
     VALUES ($1, $2, $3, $4, true, now())
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       sort_order = EXCLUDED.sort_order,
       is_active = true,
       updated_at = now()`,
    [course.id, course.title, course.description, course.sortOrder],
  );

  const unitIds: string[] = [];
  for (const unit of course.units) {
    unitIds.push(unit.id);
    await client.query(
      `INSERT INTO course_units (id, course_id, title, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         course_id = EXCLUDED.course_id,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         sort_order = EXCLUDED.sort_order`,
      [unit.id, course.id, unit.title, unit.description, unit.sortOrder],
    );
  }

  // Units removed from the Markdown are dropped; their chunks fall back to the
  // everyday pool rather than disappearing (ON DELETE SET NULL).
  await client.query(
    `DELETE FROM course_units WHERE course_id = $1 AND NOT (id = ANY($2::text[]))`,
    [course.id, unitIds],
  );
}

async function seedChunk(client: pg.PoolClient, chunk: ParsedChunk) {
  await client.query(
    `INSERT INTO chunks (id, phrase, meaning_ja, situation, nuance, level, sort_order, unit_id, is_active, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, now())
     ON CONFLICT (id) DO UPDATE SET
       phrase = EXCLUDED.phrase,
       meaning_ja = EXCLUDED.meaning_ja,
       situation = EXCLUDED.situation,
       nuance = EXCLUDED.nuance,
       level = EXCLUDED.level,
       sort_order = EXCLUDED.sort_order,
       unit_id = EXCLUDED.unit_id,
       is_active = true,
       updated_at = now()`,
    [
      chunk.id,
      chunk.phrase,
      chunk.meaningJa,
      chunk.situation,
      chunk.nuance,
      chunk.level,
      chunk.sortOrder,
      chunk.unitId,
    ],
  );

  const exampleIds: string[] = [];
  for (const example of chunk.examples) {
    const id = exampleId(chunk.id, example.sortOrder);
    exampleIds.push(id);
    await client.query(
      `INSERT INTO chunk_examples (id, chunk_id, english, japanese, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         english = EXCLUDED.english,
         japanese = EXCLUDED.japanese,
         sort_order = EXCLUDED.sort_order`,
      [id, chunk.id, example.english, example.japanese, example.sortOrder],
    );
  }
  // Drop examples removed from the Markdown since the last seed.
  await client.query(
    `DELETE FROM chunk_examples WHERE chunk_id = $1 AND NOT (id = ANY($2::text[]))`,
    [chunk.id, exampleIds],
  );

  const drillIds: string[] = [];
  for (const drill of chunk.drills) {
    const id = drillId(chunk.id, drill.type);
    drillIds.push(id);
    await client.query(
      `INSERT INTO chunk_drills (id, chunk_id, type, prompt, answer, pieces, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         type = EXCLUDED.type,
         prompt = EXCLUDED.prompt,
         answer = EXCLUDED.answer,
         pieces = EXCLUDED.pieces,
         sort_order = EXCLUDED.sort_order`,
      [
        id,
        chunk.id,
        drill.type,
        drill.prompt,
        drill.answer,
        drill.pieces,
        drill.sortOrder,
      ],
    );
  }
  await client.query(
    `DELETE FROM chunk_drills WHERE chunk_id = $1 AND NOT (id = ANY($2::text[]))`,
    [chunk.id, drillIds],
  );
}

async function main() {
  const contentDir = path.join(rootDir, "content", "chunks");
  const coursesDir = path.join(rootDir, "content", "courses");
  const [chunks, courses] = await Promise.all([
    loadChunksFromDir(contentDir),
    loadCoursesFromDir(coursesDir),
  ]);

  if (chunks.length === 0) {
    console.error(`No Markdown files found in ${contentDir}`);
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Courses first: chunks reference their units.
    for (const course of courses) {
      await seedCourse(client, course);
    }

    for (const chunk of chunks) {
      await seedChunk(client, chunk);
    }

    // Chunks whose Markdown file was deleted are deactivated rather than
    // removed, so existing user progress and flags survive.
    const { rowCount } = await client.query(
      `UPDATE chunks SET is_active = false, updated_at = now()
       WHERE is_active = true AND NOT (id = ANY($1::text[]))`,
      [chunks.map((chunk) => chunk.id)],
    );

    await client.query("COMMIT");

    console.log(`Seeded ${chunks.length} chunks from ${contentDir}`);
    if (courses.length > 0) {
      const units = courses.reduce((n, course) => n + course.units.length, 0);
      console.log(`Seeded ${courses.length} course(s), ${units} unit(s)`);
    }
    if (rowCount) console.log(`Deactivated ${rowCount} removed chunk(s)`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
