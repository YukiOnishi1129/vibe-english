import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadChunksFromDir, parseChunkMarkdown } from "@vibe-english/content";

const contentDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../content/chunks",
);

const VALID = `---
id: sample-chunk
phrase: Sample phrase?
level: A1
sortOrder: 40
---

# Sample phrase?

## 意味
サンプルの意味

## 場面
サンプルの場面。

## ニュアンス
サンプルのニュアンス。

## 例文
- First sentence. | 1つ目。
- Second sentence. | 2つ目。

## 穴埋め
First ___.
answer: sentence

## 日本語から
2つ目。
answer: Second sentence.

## 内部メモ
表示しないメモ。
`;

describe("parseChunkMarkdown", () => {
  it("parses front matter, sections, examples and drills", () => {
    const chunk = parseChunkMarkdown(VALID);

    expect(chunk.id).toBe("sample-chunk");
    expect(chunk.phrase).toBe("Sample phrase?");
    expect(chunk.level).toBe("A1");
    expect(chunk.sortOrder).toBe(40);
    expect(chunk.meaningJa).toBe("サンプルの意味");
    expect(chunk.situation).toBe("サンプルの場面。");
    expect(chunk.nuance).toBe("サンプルのニュアンス。");

    expect(chunk.examples).toEqual([
      { english: "First sentence.", japanese: "1つ目。", sortOrder: 0 },
      { english: "Second sentence.", japanese: "2つ目。", sortOrder: 10 },
    ]);

    expect(chunk.drills).toEqual([
      { type: "blank", prompt: "First ___.", answer: "sentence", sortOrder: 10 },
      {
        type: "translate",
        prompt: "2つ目。",
        answer: "Second sentence.",
        sortOrder: 20,
      },
    ]);
  });

  it("never surfaces the internal memo section", () => {
    const chunk = parseChunkMarkdown(VALID);
    const serialized = JSON.stringify(chunk);

    expect(serialized).not.toContain("表示しないメモ");
    expect(serialized).not.toContain("内部メモ");
  });

  it("rejects a missing id", () => {
    expect(() => parseChunkMarkdown(VALID.replace("id: sample-chunk", "")))
      .toThrow(/missing "id"/);
  });

  it("rejects a non-kebab-case id", () => {
    expect(() =>
      parseChunkMarkdown(VALID.replace("sample-chunk", "Sample Chunk")),
    ).toThrow(/kebab-case/);
  });

  it("rejects a drill with no answer line", () => {
    expect(() =>
      parseChunkMarkdown(VALID.replace("answer: sentence", "")),
    ).toThrow(/answer:/);
  });

  it("rejects a malformed example line", () => {
    expect(() =>
      parseChunkMarkdown(VALID.replace("- First sentence. | 1つ目。", "- Broken")),
    ).toThrow(/English \| 日本語/);
  });

  it("rejects a missing required section", () => {
    expect(() =>
      parseChunkMarkdown(VALID.replace("## ニュアンス", "## その他")),
    ).toThrow(/ニュアンス/);
  });
});

describe("content/chunks", () => {
  it("ships at least 10 MVP chunks that all parse", async () => {
    const chunks = await loadChunksFromDir(contentDir);
    expect(chunks.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique ids and is ordered by sortOrder", async () => {
    const chunks = await loadChunksFromDir(contentDir);
    const ids = chunks.map((chunk) => chunk.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect([...chunks].sort((a, b) => a.sortOrder - b.sortOrder)).toEqual(chunks);
  });

  it("gives every chunk examples and at least one drill", async () => {
    for (const chunk of await loadChunksFromDir(contentDir)) {
      expect(chunk.examples.length, chunk.id).toBeGreaterThan(0);
      expect(chunk.drills.length, chunk.id).toBeGreaterThan(0);
    }
  });
});
