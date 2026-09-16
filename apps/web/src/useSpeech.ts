import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's SpeechSynthesis for English playback.
 * No recording, no recognition, no scoring — playback only.
 */
export function useSpeech() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop playback when the user navigates away mid-sentence.
  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!supported || !text) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, speaking, speak, stop };
}
