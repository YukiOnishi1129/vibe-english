import { useEffect, useState } from "react";
import type { LabCard as Card } from "@/features/lab/hooks/useLabSession";
import { isAnswerCorrect } from "@/features/chunks/utils/answer";
import { BuildDrill } from "@/features/lab/components/BuildDrill";

// Presentational: one practice card. No judging here — this half of the
// session is practice, so every card just moves on.

export type LabCardProps = {
  card: Card;
  onSpeak: (text: string, rate?: number) => void;
  /** Lets the deck hold "next" until a question has been attempted. */
  onAnsweredChange?: (answered: boolean) => void;
};

export function LabCard({ card, onSpeak, onAnsweredChange }: LabCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [builtCorrect, setBuiltCorrect] = useState(false);
  const key = `${card.kind}:${card.chunk.id}`;

  useEffect(() => {
    setRevealed(false);
    setTyped("");
    setCorrect(null);
    setBuiltCorrect(false);
  }, [key]);

  // Steps that ask something stay "unanswered" until the learner has had a
  // go; the others are done as soon as they are shown. Speaking counts as
  // attempted once the answer has been revealed — there is nothing to grade,
  // but skipping straight past would defeat the point of the card.
  const answered =
    card.kind === "blank"
      ? correct !== null
      : card.kind === "build"
        ? builtCorrect
        : card.kind === "translate"
          ? revealed
          : true;

  useEffect(() => {
    onAnsweredChange?.(answered);
  }, [answered, onAnsweredChange]);

  const example = card.chunk.examples[0];

  // The blank and the spoken drill are written from the same sentence, so the
  // spoken prompt is that sentence's Japanese. examples[0] only coincides with
  // it sometimes, which would show the wrong gloss for the blank.
  const blankGloss =
    card.chunk.drills.find((drill) => drill.type === "translate")?.prompt ??
    example?.japanese ??
    null;
  const blankSentence =
    card.chunk.drills.find((drill) => drill.type === "translate")?.answer ??
    example?.english ??
    null;

  if (card.kind === "meaning") {
    return (
      <div className="pcard__body">
        <p className="labcard__task">こんな意味のフレーズ</p>
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
        <p className="labcard__task">聞いて、まねして言ってみよう</p>
        <p className="pcard__phrase">{card.chunk.phrase}</p>
        {/* Saying a phrase without knowing what it means is just noise. */}
        <p className="labcard__gloss">{card.chunk.meaningJa}</p>
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

  if (card.kind === "build") {
    return (
      <BuildDrill
        key={drill.id}
        drill={drill}
        gloss={drill.prompt}
        onSpeak={onSpeak}
        onChecked={() => setBuiltCorrect(true)}
      />
    );
  }

  // Writing the word is the practice; revealing it is not. Still no judgement
  // carried forward — this half is rehearsal, the test comes later.
  if (card.kind === "blank") {
    const done = correct !== null;

    return (
      <div className="pcard__body">
        <p className="labcard__task">空欄に入る語を書いてみよう</p>
        <p className="pcard__prompt">{drill.prompt}</p>

        {/* Without the Japanese the blank has several defensible answers —
            "Can I ___ a coffee?" fits get, have and order alike — so the
            meaning is shown up front rather than as a reward. */}
        {blankGloss && <p className="labcard__gloss">{blankGloss}</p>}

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

            {blankSentence && (
              <div className="labcard__example">
                <p className="examples__en">{blankSentence}</p>
              </div>
            )}

            <div className="labcard__actions">
              <button
                type="button"
                className="button button--ghost pcard__listen"
                onClick={() => onSpeak(blankSentence ?? drill.answer)}
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
      {/* The instruction belongs on the card: the step header scrolls out of
          mind, and a lone Japanese sentence gives no clue what to do with it. */}
      <p className="labcard__task">これ、英語で声に出してみて</p>
      <p className="pcard__prompt">{drill.prompt}</p>

      {!revealed ? (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setRevealed(true)}
        >
          言えたら答え合わせ
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
