import { useCallback, useMemo, useRef, useState } from "react";
import type { Chunk, ChunkDrill } from "@vibe-english/domain";

/**
 * One chunk becomes a short deck of swipeable cards, so each card holds one
 * idea instead of a wall of text.
 */
export type PracticeCard =
  | { kind: "listen"; title: string; text: string }
  | { kind: "shadow"; title: string; text: string }
  | { kind: "meaning"; title: string; front: string; back: string }
  | { kind: "usage"; title: string; situation: string; nuance: string }
  | { kind: "drill"; title: string; drill: ChunkDrill }
  | { kind: "examples"; title: string; examples: Chunk["examples"] };

export function buildDeck(chunk: Chunk): PracticeCard[] {
  const cards: PracticeCard[] = [
    { kind: "listen", title: "聞く", text: chunk.phrase },
    { kind: "shadow", title: "まねる", text: chunk.phrase },
    {
      kind: "meaning",
      title: "意味",
      front: chunk.phrase,
      back: chunk.meaningJa,
    },
    {
      kind: "usage",
      title: "使い方",
      situation: chunk.situation,
      nuance: chunk.nuance,
    },
  ];

  for (const drill of chunk.drills) {
    cards.push({
      kind: "drill",
      title: drill.type === "blank" ? "穴埋め" : "日本語から",
      drill,
    });
  }

  cards.push({ kind: "examples", title: "全文", examples: chunk.examples });
  return cards;
}

export type SwipeDirection = "left" | "right";

/**
 * Deck navigation plus the per-drill scorecard.
 *
 * Swiping either way just advances — the direction carries no meaning, so the
 * learner never has to remember which side means what. Whether a chunk lands
 * in the review list comes from the drill answers instead.
 */
export function usePracticeCards(
  chunk: Chunk | undefined,
  /** Called once, when the last card is dismissed. */
  onComplete?: (struggled: boolean) => void,
) {
  const cards = useMemo(() => (chunk ? buildDeck(chunk) : []), [chunk]);

  const [index, setIndex] = useState(0);
  // Which way the *previous* card left, purely so the incoming card can
  // animate in from the right side. Advancing never waits on it.
  const [lastDirection, setLastDirection] = useState<SwipeDirection>("right");
  const [missedDrills, setMissedDrills] = useState<Set<string>>(new Set());
  // Mirrors the state so `advance` can read it without being re-created on
  // every answer.
  const missedRef = useRef(missedDrills);

  const finished = index >= cards.length;

  /**
   * Advances immediately. An earlier version delayed this behind a timeout so
   * the outgoing card could fly out, which dropped taps that arrived mid
   * animation; the exit is now rendered by the leaving card itself.
   */
  const advance = useCallback(
    (direction: SwipeDirection) => {
      setLastDirection(direction);
      setIndex((value) => {
        const next = Math.min(value + 1, cards.length);
        // Report at the exact moment the deck runs out, reading the answer
        // set as it stands right now rather than on a later render.
        if (next === cards.length && value < cards.length) {
          onComplete?.(missedRef.current.size > 0);
        }
        return next;
      });
    },
    [cards.length, onComplete],
  );

  const back = useCallback(() => {
    setLastDirection("left");
    setIndex((value) => Math.max(0, value - 1));
  }, []);

  const markDrill = useCallback((drillId: string, correct: boolean) => {
    setMissedDrills((previous) => {
      const next = new Set(previous);
      if (correct) next.delete(drillId);
      else next.add(drillId);
      missedRef.current = next;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setIndex(0);
    missedRef.current = new Set();
    setMissedDrills(new Set());
  }, []);

  return {
    cards,
    card: cards[index],
    nextCard: cards[index + 1],
    index,
    total: cards.length,
    isLast: index >= cards.length - 1,
    finished,
    lastDirection,
    /** A chunk needs review when any drill was answered wrong. */
    struggled: missedDrills.size > 0,
    advance,
    back,
    markDrill,
    reset,
  };
}
