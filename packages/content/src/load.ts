import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseChunkMarkdown, type ParsedChunk } from "./parse";
import { parseCourseMarkdown, type ParsedCourse } from "./parseCourse";

/**
 * Reads and parses every `*.md` under `dir`, ordered by sortOrder then id so
 * seeding is deterministic. Node-only (used by the seed script).
 */
export async function loadChunksFromDir(dir: string): Promise<ParsedChunk[]> {
  const entries = await readdir(dir);
  const files = entries.filter((name) => name.endsWith(".md")).sort();

  const chunks: ParsedChunk[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const source = await readFile(path.join(dir, file), "utf8");
    const chunk = parseChunkMarkdown(source, file);

    const duplicate = seen.get(chunk.id);
    if (duplicate) {
      throw new Error(
        `duplicate chunk id "${chunk.id}" in ${file} and ${duplicate}`,
      );
    }
    seen.set(chunk.id, file);
    chunks.push(chunk);
  }

  return chunks.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
}

/** Reads and parses every course file under `dir`. */
export async function loadCoursesFromDir(dir: string): Promise<ParsedCourse[]> {
  const entries = await readdir(dir).catch(() => [] as string[]);
  const files = entries.filter((name) => name.endsWith(".md")).sort();

  const courses: ParsedCourse[] = [];
  for (const file of files) {
    const source = await readFile(path.join(dir, file), "utf8");
    courses.push(parseCourseMarkdown(source, file));
  }

  return courses.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
}
