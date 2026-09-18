import matter from "gray-matter";

export type ParsedUnit = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

export type ParsedCourse = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  units: ParsedUnit[];
};

/** Parses one course file from content/courses/*.md. Throws on bad input. */
export function parseCourseMarkdown(
  source: string,
  file = "course",
): ParsedCourse {
  const { data } = matter(source);

  const id = typeof data.id === "string" ? data.id.trim() : "";
  if (!id) throw new Error(`${file}: front matter is missing "id"`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`${file}: "id" must be kebab-case ascii — got "${id}"`);
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) throw new Error(`${file}: front matter is missing "title"`);

  const rawUnits = Array.isArray(data.units) ? data.units : [];
  if (rawUnits.length === 0) {
    throw new Error(`${file}: a course needs at least one unit`);
  }

  const seen = new Set<string>();
  const units = rawUnits.map((unit, index) => {
    const unitId = typeof unit?.id === "string" ? unit.id.trim() : "";
    const unitTitle = typeof unit?.title === "string" ? unit.title.trim() : "";

    if (!unitId) throw new Error(`${file}: unit ${index + 1} is missing "id"`);
    if (!unitTitle) {
      throw new Error(`${file}: unit "${unitId}" is missing "title"`);
    }
    if (seen.has(unitId)) {
      throw new Error(`${file}: duplicate unit id "${unitId}"`);
    }
    seen.add(unitId);

    return {
      id: unitId,
      title: unitTitle,
      description:
        typeof unit?.description === "string" ? unit.description.trim() : null,
      // Order comes from the list itself, so authors just reorder the YAML.
      sortOrder: (index + 1) * 10,
    };
  });

  return {
    id,
    title,
    description:
      typeof data.description === "string" ? data.description.trim() : null,
    sortOrder: Number.isFinite(data.sortOrder) ? Number(data.sortOrder) : 0,
    units,
  };
}
