import { useCallback, useRef, useState } from "react";

export type SwipeState = {
  dx: number;
  dragging: boolean;
  /** Set while the card flies off, before the deck advances. */
  flyingOut: "left" | "right" | null;
};

/** Distance that counts as a deliberate swipe. */
const DISTANCE = 55;
/** A quick flick counts even if it did not travel far (px per ms). */
const VELOCITY = 0.4;
/** Below this, treat the gesture as a tap and let the click through. */
const TAP_SLOP = 8;
/** How long the card takes to leave the screen; matches the CSS transition. */
const FLY_OUT_MS = 180;

/**
 * Pointer-drag swiping for a card stack.
 *
 * Uses Pointer Events so mouse, touch and pen share one path, and captures the
 * pointer so a fast flick that leaves the element still completes the gesture.
 */
export function useSwipe(onSwipe: (direction: "left" | "right") => void) {
  const [state, setState] = useState<SwipeState>({
    dx: 0,
    dragging: false,
    flyingOut: null,
  });
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const active = useRef(false);
  const lastDx = useRef(0);
  /** The exit animation in flight, if any. */
  const pendingExit = useRef<{ timer: number; commit: () => void } | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    // Let buttons inside the card handle their own clicks.
    if ((event.target as HTMLElement).closest("button, a")) return;

    // A new grab during the exit animation settles the previous card at once,
    // so a fast series of swipes never drops one.
    if (pendingExit.current) {
      window.clearTimeout(pendingExit.current.timer);
      pendingExit.current.commit();
      pendingExit.current = null;
    }

    active.current = true;
    startX.current = event.clientX;
    startY.current = event.clientY;
    startTime.current = performance.now();
    lastDx.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    setState({ dx: 0, dragging: true, flyingOut: null });
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!active.current) return;

    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    // A mostly-vertical drag is the page scrolling, not a swipe.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
      active.current = false;
      setState({ dx: 0, dragging: false, flyingOut: null });
      return;
    }

    lastDx.current = dx;
    setState({ dx, dragging: true, flyingOut: null });
  }, []);

  const end = useCallback(
    (event: React.PointerEvent) => {
      if (!active.current) return;
      active.current = false;

      // Use the last position seen during the drag, not the pointerup
      // coordinate: a fast flick can report a release near the origin, which
      // made a real swipe look like a tap.
      const dx = lastDx.current !== 0 ? lastDx.current : event.clientX - startX.current;
      const elapsed = Math.max(1, performance.now() - startTime.current);
      const speed = Math.abs(dx) / elapsed;

      const committed =
        Math.abs(dx) >= TAP_SLOP &&
        (Math.abs(dx) >= DISTANCE || speed >= VELOCITY);

      if (!committed) {
        // Not far enough: spring back to centre.
        setState({ dx: 0, dragging: false, flyingOut: null });
        return;
      }

      const direction = dx > 0 ? "right" : "left";

      // Keep the card off-screen until the deck has advanced, otherwise it
      // snaps back to centre first and reads as "the same card returned".
      setState({ dx, dragging: false, flyingOut: direction });

      const commit = () => {
        // Clear the offset in the same update that advances the deck, so the
        // incoming card is never painted at the outgoing card's position.
        setState({ dx: 0, dragging: false, flyingOut: null });
        onSwipe(direction);
      };

      const timer = window.setTimeout(() => {
        pendingExit.current = null;
        commit();
      }, FLY_OUT_MS);

      pendingExit.current = { timer, commit };
    },
    [onSwipe],
  );

  return {
    state,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
