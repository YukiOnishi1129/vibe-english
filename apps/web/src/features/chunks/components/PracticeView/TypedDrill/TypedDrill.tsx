import { useState } from "react";
import type { ChunkDrill } from "@vibe-english/domain";
import { isAnswerCorrect } from "@/features/chunks/utils/answer";

// Presentational: fill-in-the-blank, typed and graded automatically.
// Writing the word is the point, so there is no reveal shortcut.

export type TypedDrillProps = {
  drill: ChunkDrill;
  onSpeak: (text: string, rate?: number) => void;
  onAnswer: (drillId: string, correct: boolean) => void;
};

export function TypedDrill({ drill, onSpeak, onAnswer }: TypedDrillProps) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  const submit = () => {
    if (result !== null || value.trim() === "") return;
    const correct = isAnswerCorrect(value, drill.answer);
    setResult(correct);
    onAnswer(drill.id, correct);
  };

  return (
    <div className="pcard__body">
      <p className="pcard__kicker">空欄に入るのは？</p>
      <p className="pcard__prompt">{drill.prompt}</p>

      <form
        className="answerbox"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          className={[
            "answerbox__input",
            result === true && "answerbox__input--ok",
            result === false && "answerbox__input--ng",
          ]
            .filter(Boolean)
            .join(" ")}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ここに入力"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={result !== null}
          aria-label="答えを入力"
        />
        {result === null && (
          <button
            type="submit"
            className="button button--primary"
            disabled={value.trim() === ""}
          >
            答える
          </button>
        )}
      </form>

      {result !== null && (
        <div className="answerbox__result">
          <p className={result ? "answerbox__ok" : "answerbox__ng"}>
            {result ? "正解！ 🎉" : `惜しい。答えは "${drill.answer}"`}
          </p>
          <button
            type="button"
            className="button button--ghost pcard__listen"
            onClick={() => onSpeak(drill.answer)}
          >
            🔊 聞く
          </button>
        </div>
      )}
    </div>
  );
}
