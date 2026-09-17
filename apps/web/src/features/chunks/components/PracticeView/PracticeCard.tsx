import { useEffect, useState } from "react";
import type { ChunkDrill } from "@vibe-english/domain";
import type { PracticeCard as Card } from "@/features/chunks/hooks/usePracticeCards";

// Presentational: renders one card face. Flip/typing state is local UI.

/** Forgiving comparison: case, spacing and trailing punctuation don't count. */
function isCorrect(input: string, answer: string): boolean {
  const normalise = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[.!?,]+$/g, "")
      .replace(/\s+/g, " ");

  return normalise(input) === normalise(answer);
}

/**
 * Fill-in-the-blank: typed, then graded automatically. Writing the word is the
 * point, so there is no reveal shortcut here.
 */
function TypedDrill({
  drill,
  onSpeak,
  onAnswer,
}: {
  drill: ChunkDrill;
  onSpeak: (text: string, rate?: number) => void;
  onAnswer: (drillId: string, correct: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  const submit = () => {
    if (result !== null || value.trim() === "") return;
    const correct = isCorrect(value, drill.answer);
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

/**
 * Japanese to English: say it out loud, then check yourself. Typing a whole
 * sentence would slow the deck down, and speaking is the skill being
 * practised, so this one stays self-reported.
 */
function SpokenDrill({
  drill,
  onSpeak,
  onAnswer,
}: {
  drill: ChunkDrill;
  onSpeak: (text: string, rate?: number) => void;
  onAnswer: (drillId: string, correct: boolean) => void;
}) {
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

export function PracticeCard({
  card,
  onSpeak,
  onDrillAnswer,
}: {
  card: Card;
  onSpeak: (text: string, rate?: number) => void;
  onDrillAnswer: (drillId: string, correct: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  // A new card always starts face down.
  const key = card.kind === "drill" ? card.drill.id : card.kind;
  useEffect(() => setFlipped(false), [key]);

  if (card.kind === "listen" || card.kind === "shadow") {
    const slow = card.kind === "shadow";
    return (
      <div className="pcard__body">
        <p className="pcard__kicker">
          {slow ? "声に出してまねしよう" : "まず音を聞こう"}
        </p>
        <p className="pcard__phrase">{card.text}</p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => onSpeak(card.text, slow ? 0.55 : 1)}
        >
          {slow ? "🐢 ゆっくり聞く" : "🔊 聞く"}
        </button>
        {slow && <p className="pcard__hint">録音はしません。気楽にどうぞ。</p>}
      </div>
    );
  }

  if (card.kind === "meaning") {
    return (
      <div className="pcard__body">
        <p className="pcard__kicker">どんな意味だと思う？</p>
        <p className="pcard__phrase">{card.front}</p>
        {flipped ? (
          <p className="pcard__reveal">{card.back}</p>
        ) : (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setFlipped(true)}
          >
            答え合わせ
          </button>
        )}
      </div>
    );
  }

  if (card.kind === "usage") {
    return (
      <div className="pcard__body pcard__body--text">
        <dl className="usage">
          <dt>場面</dt>
          <dd>{card.situation}</dd>
          <dt>ニュアンス</dt>
          <dd>{card.nuance}</dd>
        </dl>
      </div>
    );
  }

  if (card.kind === "drill") {
    return card.drill.type === "blank" ? (
      <TypedDrill
        key={card.drill.id}
        drill={card.drill}
        onSpeak={onSpeak}
        onAnswer={onDrillAnswer}
      />
    ) : (
      <SpokenDrill
        key={card.drill.id}
        drill={card.drill}
        onSpeak={onSpeak}
        onAnswer={onDrillAnswer}
      />
    );
  }

  return (
    <div className="pcard__body pcard__body--text">
      <ul className="examples">
        {card.examples.map((example) => (
          <li key={example.id} className="examples__item">
            <button
              type="button"
              className="examples__play"
              onClick={() => onSpeak(example.english)}
              aria-label={`${example.english} を再生`}
            >
              🔊
            </button>
            <div>
              <p className="examples__en">{example.english}</p>
              <p className="examples__ja">{example.japanese}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
