import { useEffect, useState } from "react";
import type { PracticeCard as Card } from "@/features/chunks/hooks/usePracticeCards";
import { TypedDrill } from "@/features/chunks/components/PracticeView/TypedDrill";
import { SpokenDrill } from "@/features/chunks/components/PracticeView/SpokenDrill";

// Presentational: renders one card face. Flip state is local UI.

export type PracticeCardProps = {
  card: Card;
  onSpeak: (text: string, rate?: number) => void;
  onDrillAnswer: (drillId: string, correct: boolean) => void;
};

export function PracticeCard({
  card,
  onSpeak,
  onDrillAnswer,
}: PracticeCardProps) {
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
          onClick={() => onSpeak(card.text, slow ? 0.4 : 1)}
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
