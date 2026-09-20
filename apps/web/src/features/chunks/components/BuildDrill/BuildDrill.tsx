import { useMemo, useState } from "react";
import type { ChunkDrill } from "@vibe-english/domain";
import { joinPieces, shufflePieces } from "@/features/chunks/utils/build";

// Presentational: assemble the sentence from word groups.
//
// Sits between the blank (one word) and speaking it aloud (the whole
// sentence): the learner produces the full sentence, but with the vocabulary
// in front of them.

export type BuildDrillProps = {
  drill: ChunkDrill;
  gloss: string | null;
  onSpeak: (text: string) => void;
  /** Fires once the answer has been checked, right or wrong. */
  onChecked?: () => void;
};

export function BuildDrill({
  drill,
  gloss,
  onSpeak,
  onChecked,
}: BuildDrillProps) {
  // Both memos key on drill.pieces itself: `?? []` would build a new array
  // every render and reshuffle the tiles under the learner's finger.
  const pieces = useMemo(() => drill.pieces ?? [], [drill.pieces]);
  const pool = useMemo(
    () => shufflePieces(pieces, drill.id),
    [pieces, drill.id],
  );

  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);

  const built = picked.map((index) => pool[index]);
  const complete = picked.length === pool.length;

  const check = () => {
    if (!complete || result !== null) return;
    setResult(joinPieces(built) === joinPieces(pieces));
    onChecked?.();
  };

  const reset = () => {
    setPicked([]);
    setResult(null);
  };

  return (
    <div className="pcard__body">
      <p className="scard__task">並べて文を作ろう</p>
      {gloss && <p className="pcard__prompt">{gloss}</p>}

      {/* What has been built so far. */}
      <div className="build__line" aria-live="polite">
        {built.length === 0 ? (
          <span className="build__placeholder">ここに並びます</span>
        ) : (
          built.map((piece, position) => (
            <button
              key={`${piece}-${position}`}
              type="button"
              className="build__tile build__tile--picked"
              onClick={() =>
                result === null &&
                setPicked((value) => value.filter((_, i) => i !== position))
              }
              disabled={result !== null}
            >
              {piece}
            </button>
          ))
        )}
      </div>

      {/* The groups still available. */}
      <div className="build__pool">
        {pool.map((piece, index) =>
          picked.includes(index) ? null : (
            <button
              key={`${piece}-${index}`}
              type="button"
              className="build__tile"
              onClick={() => setPicked((value) => [...value, index])}
              disabled={result !== null}
            >
              {piece}
            </button>
          ),
        )}
      </div>

      {result === null ? (
        <button
          type="button"
          className="button button--primary"
          onClick={check}
          disabled={!complete}
        >
          答え合わせ
        </button>
      ) : (
        <>
          <p className={result ? "answerbox__ok" : "answerbox__ng"}>
            {result ? "正解！ 🎉" : `おしい。${drill.answer}`}
          </p>
          <div className="scard__actions">
            <button
              type="button"
              className="button button--ghost pcard__listen"
              onClick={() => onSpeak(drill.answer)}
            >
              🔊 聞く
            </button>
            <button
              type="button"
              className="button button--ghost pcard__listen"
              onClick={reset}
            >
              もう一度解く
            </button>
          </div>
        </>
      )}
    </div>
  );
}
