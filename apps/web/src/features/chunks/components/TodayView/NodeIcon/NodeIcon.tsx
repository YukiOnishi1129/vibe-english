// Presentational: the glyph inside a path node.
//
// Inline SVG rather than emoji or text: a glyph sits on its baseline, so it
// lands off-centre inside a circle no matter how the box is aligned. A
// viewBox-centred path is centred by construction.

export type NodeIconKind = "done" | "review" | "todo";

const PATHS: Record<NodeIconKind, string> = {
  done: "M5 12.5l4.5 4.5L19 7.5",
  review: "M4 9h11a4 4 0 010 8h-7m0 0l3-3m-3 3l3 3",
  todo: "M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z",
};

export function NodeIcon({ kind }: { kind: NodeIconKind }) {
  const filled = kind === "todo";

  return (
    <svg
      className="path__icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[kind]} />
    </svg>
  );
}
