import { useSpeech } from "@/shared/hooks/useSpeech";
import {
  useDailySession,
  useRecordQuizMisses,
} from "@/features/chunks/hooks/useChunks";
import {
  useWrapUpQuiz,
  type QuizResult,
} from "@/features/chunks/hooks/useWrapUpQuiz";
import { QuizViewPresenter } from "./QuizViewPresenter";

export function QuizViewContainer() {
  const { data: session, isPending } = useDailySession();
  const { speak } = useSpeech();
  const recordMisses = useRecordQuizMisses();

  const handleFinish = (result: QuizResult) => {
    if (result.missedChunkIds.length > 0) {
      recordMisses.mutate(result.missedChunkIds);
    }
  };

  const quiz = useWrapUpQuiz(session?.chunks ?? [], handleFinish);

  return (
    <QuizViewPresenter
      question={quiz.question}
      index={quiz.index}
      total={quiz.total}
      correct={quiz.correct}
      finished={quiz.finished}
      isLoading={isPending}
      onAnswer={quiz.answer}
      onSpeak={speak}
      onRestart={quiz.restart}
    />
  );
}
