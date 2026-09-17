import { useState } from "react";
import type { ChunkDrill } from "@vibe-english/domain";

// Presentational: Japanese to English. Say it out loud, then check yourself.
// Typing a whole sentence would slow the deck down, and speaking is the skill
// being practised, so this one stays self-reported.

export type SpokenDrillProps = {
  drill: ChunkDrill;
  onSpeak: (text: string, rate?: number) => void;
  onAnswer: (drillId: string, correct: boolean) => void;
};

export function SpokenDrill({ drill, onSpeak, onAnswer }: SpokenDrillProps) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState<boolean | null>(null);

  return (
    <div className="pcard__body">
      <p className="pcard__kicker">声に出して英語にしてみよう</p>
      <p className="pcard__prompt">{drill.prompt}</p>

      {!flipped ? (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setFlipped(true)}
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

          {answered === null ? (
            <div className="pcard__judge">
              <button
                type="button"
                className="button button--success"
                onClick={() => {
                  setAnswered(true);
                  onAnswer(drill.id, true);
                }}
              >
                言えた
              </button>
              <button
                type="button"
                className="button button--warn"
                onClick={() => {
                  setAnswered(false);
                  onAnswer(drill.id, false);
                }}
              >
                言えなかった
              </button>
            </div>
          ) : (
            <p className="pcard__judged">
              {answered ? "ナイス 🎉" : "次はいける 💪"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
