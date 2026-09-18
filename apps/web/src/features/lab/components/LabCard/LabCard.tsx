import { useEffect, useState } from "react";
import type { LabCard as Card } from "@/features/lab/hooks/useLabSession";
import { isAnswerCorrect } from "@/features/chunks/utils/answer";

// Presentational: one practice card. No judging here — this half of the
// session is practice, so every card just moves on.

export type LabCardProps = {
  card: Card;
  onSpeak: (text: string, rate?: number) => void;
};

export function LabCard({ card, onSpeak }: LabCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const key = `${card.kind}:${card.chunk.id}`;

  useEffect(() => {
    setRevealed(false);
    setTyped("");
    setCorrect(null);
  }, [key]);

  const example = card.chunk.examples[0];

  if (card.kind === "meaning") {
    return (
      <div className="pcard__body">
        <p className="pcard__phrase">{card.chunk.phrase}</p>
        <p className="pcard__reveal">{card.chunk.meaningJa}</p>

        {example && (
          <div className="labcard__example">
            <p className="examples__en">{example.english}</p>
            <p className="examples__ja">{example.japanese}</p>
          </div>
        )}
      </div>
    );
  }

  if (card.kind === "speak") {
    return (
      <div className="pcard__body">
        <p className="pcard__phrase">{card.chunk.phrase}</p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => onSpeak(card.chunk.phrase)}
        >
          🔊 聞く
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onSpeak(card.chunk.phrase, 0.4)}
        >
          🐢 ゆっくり
        </button>
      </div>
    );
  }

  if (!card.drill) return null;
  const { drill } = card;

  // Writing the word is the practice; revealing it is not. Still no judgement
  // carried forward — this half is rehearsal, the test comes later.
  if (card.kind === "blank") {
    const done = correct !== null;

    return (
      <div className="pcard__body">
        <p className="pcard__prompt">{drill.prompt}</p>

        {/* Without the Japanese the blank has several defensible answers —
            "Can I ___ a coffee?" fits get, have and order alike — so the
            meaning is shown up front rather than as a reward. */}
        {example && <p className="labcard__gloss">{example.japanese}</p>}

        <form
          className="answerbox"
          onSubmit={(event) => {
            event.preventDefault();
            if (done || typed.trim() === "") return;
            setCorrect(isAnswerCorrect(typed, drill.answer));
          }}
        >
          <input
            className={[
              "answerbox__input",
              correct === true && "answerbox__input--ok",
              correct === false && "answerbox__input--ng",
            ]
              .filter(Boolean)
              .join(" ")}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="ここに入力"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={done}
            aria-label="答えを入力"
          />
          {!done && (
            <button
              type="submit"
              className="button button--primary"
              disabled={typed.trim() === ""}
            >
              答える
            </button>
          )}
        </form>

        {done && (
          <>
            <p className={correct ? "answerbox__ok" : "answerbox__ng"}>
              {correct ? "正解！ 🎉" : `答えは "${drill.answer}"`}
            </p>

            {example && (
              <div className="labcard__example">
                <p className="examples__en">{example.english}</p>
              </div>
            )}

            <div className="labcard__actions">
              <button
                type="button"
                className="button button--ghost pcard__listen"
                onClick={() => onSpeak(example ? example.english : drill.answer)}
              >
                🔊 通して聞く
              </button>
              {/* Practice, not a test: getting it wrong should be one tap away
                  from another go rather than something to move past. */}
              <button
                type="button"
                className="button button--ghost pcard__listen"
                onClick={() => {
                  setTyped("");
                  setCorrect(null);
                }}
              >
                もう一度解く
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pcard__body">
      <p className="pcard__prompt">{drill.prompt}</p>

      {!revealed ? (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setRevealed(true)}
        >
          答えを見る
        </button>
      ) : (
        <>
          <p className="pcard__reveal">{drill.answer}</p>

          <button
            type="button"
            className="button button--ghost pcard__listen"
            onClick={() => onSpeak(drill.answer)}
          >
            🔊 聞く
          </button>
        </>
      )}
    </div>
  );
}
