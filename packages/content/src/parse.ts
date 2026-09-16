import matter from "gray-matter";

export type ParsedExample = {
  english: string;
  japanese: string;
  sortOrder: number;
};

export type ParsedDrill = {
  type: "blank" | "translate";
  prompt: string;
  answer: string;
  sortOrder: number;
};

export type ParsedChunk = {
  id: string;
  phrase: string;
  meaningJa: string;
  situation: string;
  nuance: string;
  level: string | null;
  sortOrder: number;
  examples: ParsedExample[];
  drills: ParsedDrill[];
};

// Japanese section headings used by content/chunks/*.md.
const SECTION = {
  meaning: "意味",
  situation: "場面",
  nuance: "ニュアンス",
  examples: "例文",
  blank: "穴埋め",
  translate: "日本語から",
  /** Author-only notes; never surfaced to the app. */
  internal: "内部メモ",
} as const;

/** Splits the Markdown body into `## <heading>` sections. */
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current !== null) {
      sections.set(current, buffer.join("\n").trim());
    }
  };

  for (const line of body.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      current = heading[1];
      buffer = [];
      continue;
    }
    if (current !== null) buffer.push(line);
  }
  flush();

  return sections;
}

function requireSection(
  sections: Map<string, string>,
  name: string,
  file: string,
): string {
  const value = sections.get(name);
  if (!value) {
    throw new Error(`${file}: missing or empty "## ${name}" section`);
  }
  return value;
}

/** `- English sentence | 日本語訳` */
function parseExamples(raw: string, file: string): ParsedExample[] {
  const examples: ParsedExample[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const item = /^[-*]\s+(.*)$/.exec(line.trim());
    if (!item) continue;

    const [english, japanese, ...rest] = item[1].split("|").map((s) => s.trim());
    if (!english || !japanese || rest.length > 0) {
      throw new Error(
        `${file}: example must be "English | 日本語" — got "${item[1]}"`,
      );
    }

    examples.push({ english, japanese, sortOrder: examples.length * 10 });
  }

  if (examples.length === 0) {
    throw new Error(`${file}: "## ${SECTION.examples}" has no examples`);
  }
  return examples;
}

/**
 * A drill section is a prompt followed by an `answer:` line:
 *
 *   Can I ___ a coffee?
 *   answer: get
 */
function parseDrill(
  raw: string,
  type: ParsedDrill["type"],
  sortOrder: number,
  file: string,
  heading: string,
): ParsedDrill {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const answerIndex = lines.findIndex((line) => /^answer:/i.test(line));
  if (answerIndex === -1) {
    throw new Error(`${file}: "## ${heading}" is missing an "answer:" line`);
  }

  const prompt = lines.slice(0, answerIndex).join("\n").trim();
  const answer = lines[answerIndex].replace(/^answer:/i, "").trim();

  if (!prompt) {
    throw new Error(`${file}: "## ${heading}" is missing a prompt`);
  }
  if (!answer) {
    throw new Error(`${file}: "## ${heading}" has an empty answer`);
  }

  return { type, prompt, answer, sortOrder };
}

/** Parses one chunk Markdown file. Throws on malformed content. */
export function parseChunkMarkdown(source: string, file = "chunk"): ParsedChunk {
  const { data, content } = matter(source);

  const id = typeof data.id === "string" ? data.id.trim() : "";
  if (!id) throw new Error(`${file}: front matter is missing "id"`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`${file}: "id" must be kebab-case ascii — got "${id}"`);
  }

  const phrase = typeof data.phrase === "string" ? data.phrase.trim() : "";
  if (!phrase) throw new Error(`${file}: front matter is missing "phrase"`);

  const sections = splitSections(content);

  const drills: ParsedDrill[] = [];
  const blank = sections.get(SECTION.blank);
  if (blank) {
    drills.push(parseDrill(blank, "blank", 10, file, SECTION.blank));
  }
  const translate = sections.get(SECTION.translate);
  if (translate) {
    drills.push(
      parseDrill(translate, "translate", 20, file, SECTION.translate),
    );
  }
  if (drills.length === 0) {
    throw new Error(
      `${file}: needs at least one drill ("## ${SECTION.blank}" or "## ${SECTION.translate}")`,
    );
  }

  return {
    id,
    phrase,
    meaningJa: requireSection(sections, SECTION.meaning, file),
    situation: requireSection(sections, SECTION.situation, file),
    nuance: requireSection(sections, SECTION.nuance, file),
    level: typeof data.level === "string" ? data.level.trim() : null,
    sortOrder: Number.isFinite(data.sortOrder) ? Number(data.sortOrder) : 0,
    examples: parseExamples(
      requireSection(sections, SECTION.examples, file),
      file,
    ),
    drills,
  };
}

/** Stable, content-addressed child ids keep the seed idempotent. */
export function exampleId(chunkId: string, sortOrder: number): string {
  return `${chunkId}-ex-${sortOrder}`;
}

export function drillId(chunkId: string, type: string): string {
  return `${chunkId}-drill-${type}`;
}
