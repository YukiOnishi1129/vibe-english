import { useCallback, useRef } from "react";
import { useSpeech } from "@/shared/hooks/useSpeech";
import { useSwipe } from "@/shared/hooks/useSwipe";
import {
  useDailySession,
  useRecordQuizMisses,
} from "@/features/chunks/hooks/useChunks";
import {
  useWrapUpQuiz,
  type QuizResult,
} from "@/features/chunks/hooks/useWrapUpQuiz";
import { LabTestViewPresenter } from "./LabTestViewPresenter";

export function LabTestViewContainer() {
  const { data: session, isPending } = useDailySession();
  const { speak } = useSpeech();
  const recordMisses = useRecordQuizMisses();

  const handleFinish = (result: QuizResult) => {
    if (result.missedChunkIds.length > 0) {
      recordMisses.mutate(result.missedChunkIds);
    }
  };

  const quiz = useWrapUpQuiz(session?.chunks ?? [], handleFinish);

  // Swiping only means anything on the spoken questions, where there is
  // nothing to type and the learner reports the outcome themselves.
  //
  // `answer` is reached through a ref: the quiz object is rebuilt on every
  // render, so a callback that closed over it directly would keep calling the
  // first render's version and the deck would never advance.
  const answerRef = useRef(quiz.answer);
  answerRef.current = quiz.answer;

  const onSwipe = useCallback(
    (direction: "left" | "right") => answerRef.current(direction === "right"),
    [],
  );
  const { state, handlers } = useSwipe(onSwipe);

  return (
    <LabTestViewPresenter
      question={quiz.question}
      index={quiz.index}
      total={quiz.total}
      correct={quiz.correct}
      finished={quiz.finished}
      isLoading={isPending}
      dragX={state.dx}
      dragging={state.dragging}
      swipeHandlers={handlers}
      onAnswer={quiz.answer}
      onSpeak={speak}
    />
  );
}
