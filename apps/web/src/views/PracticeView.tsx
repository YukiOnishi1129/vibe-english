import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Chunk, ChunkDrill } from "@vibe-english/domain";
import { api } from "../api";
import { useSpeech } from "../useSpeech";

const STEPS = [
  "聞く",
  "まねる",
  "使い方",
  "穴埋め",
  "日本語から",
  "全文",
  "完了",
] as const;

function findDrill(chunk: Chunk, type: ChunkDrill["type"]) {
  return chunk.drills.find((drill) => drill.type === type) ?? null;
}

/** Drill step shared by 穴埋め and 日本語から: prompt + reveal. */
function DrillStep({
  drill,
  hint,
  onSpeak,
}: {
  drill: ChunkDrill | null;
  hint: string;
  onSpeak: (text: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  // A new drill starts hidden again.
  useEffect(() => setRevealed(false), [drill?.id]);

  if (!drill) return <p className="muted">この問題はまだありません。</p>;

  return (
    <div className="step__body">
      <p className="muted">{hint}</p>
      <p className="prompt">{drill.prompt}</p>

      {revealed ? (
        <div className="answer">
          <p className="answer__text">{drill.answer}</p>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onSpeak(drill.answer)}
          >
            🔊 答えを聞く
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setRevealed(true)}
        >
          答えを見る
        </button>
      )}
    </div>
  );
}

export function PracticeView() {
  const { chunkId } = useParams<{ chunkId: string }>();
  const navigate = useNavigate();
  const { supported, speak } = useSpeech();

  const [chunk, setChunk] = useState<Chunk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!chunkId) return;
    setChunk(null);
    setStepIndex(0);
    setCompleted(false);
    api
      .getChunk(chunkId)
      .then(setChunk)
      .catch(() => setError("このフレーズを読み込めませんでした。"));
  }, [chunkId]);

  const toggleHard = useCallback(async () => {
    if (!chunk) return;
    const next = !chunk.isHard;
    // Optimistic: the toggle should feel instant.
    setChunk({ ...chunk, isHard: next });
    try {
      await api.setHardFlag(chunk.id, next);
    } catch {
      setChunk({ ...chunk, isHard: !next });
    }
  }, [chunk]);

  const complete = useCallback(async () => {
    if (!chunk || saving) return;
    setSaving(true);
    try {
      await api.completeChunk(chunk.id);
      setCompleted(true);
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }, [chunk, saving]);

  if (error) {
    return (
      <main className="screen">
        <p className="error">{error}</p>
        <Link className="button button--ghost" to="/">
          今日へ戻る
        </Link>
      </main>
    );
  }

  if (!chunk) {
    return (
      <main className="screen screen--center">
        <p className="muted">読み込み中…</p>
      </main>
    );
  }

  const step = STEPS[stepIndex];
  const firstExample = chunk.examples[0];
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <main className="screen">
      <header className="header">
        <Link className="header__link" to="/">
          ← 今日
        </Link>
        <button
          type="button"
          className={`chip ${chunk.isHard ? "chip--on" : ""}`}
          onClick={toggleHard}
          aria-pressed={chunk.isHard}
        >
          難しい
        </button>
      </header>

      <h1 className="practice__phrase">{chunk.phrase}</h1>

      <ol className="stepper" aria-label="練習ステップ">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`stepper__dot ${index <= stepIndex ? "stepper__dot--on" : ""}`}
            aria-current={index === stepIndex ? "step" : undefined}
          >
            <span className="visually-hidden">{label}</span>
          </li>
        ))}
      </ol>

      <section className="step">
        <h2 className="step__title">
          {stepIndex + 1}. {step}
        </h2>

        {!supported && step !== "使い方" && (
          <p className="muted">
            このブラウザは音声読み上げに対応していません。
          </p>
        )}

        {step === "聞く" && (
          <div className="step__body">
            <p className="muted">まずは音を聞いてみよう。</p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => speak(chunk.phrase)}
            >
              🔊 聞く
            </button>
            {firstExample && (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => speak(firstExample.english)}
              >
                🔊 例文を聞く
              </button>
            )}
          </div>
        )}

        {step === "まねる" && (
          <div className="step__body">
            <p className="muted">声に出してまねしてみよう。録音はしません。</p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => speak(chunk.phrase, 0.75)}
            >
              🐢 ゆっくり聞く
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => speak(chunk.phrase)}
            >
              🔊 普通の速さ
            </button>
          </div>
        )}

        {step === "使い方" && (
          <div className="step__body">
            <dl className="usage">
              <dt>意味</dt>
              <dd>{chunk.meaningJa}</dd>
              <dt>場面</dt>
              <dd>{chunk.situation}</dd>
              <dt>ニュアンス</dt>
              <dd>{chunk.nuance}</dd>
            </dl>
          </div>
        )}

        {step === "穴埋め" && (
          <DrillStep
            drill={findDrill(chunk, "blank")}
            hint="空欄に入る語は？"
            onSpeak={speak}
          />
        )}

        {step === "日本語から" && (
          <DrillStep
            drill={findDrill(chunk, "translate")}
            hint="英語にしてみよう。"
            onSpeak={speak}
          />
        )}

        {step === "全文" && (
          <ul className="examples">
            {chunk.examples.map((example) => (
              <li key={example.id} className="examples__item">
                <button
                  type="button"
                  className="examples__play"
                  onClick={() => speak(example.english)}
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
        )}

        {step === "完了" && (
          <div className="step__body">
            {completed ? (
              <>
                <p className="done">ナイス！今日のノリ、記録した。</p>
                <Link className="button button--primary" to="/">
                  今日の一覧へ
                </Link>
              </>
            ) : (
              <>
                <p className="muted">お疲れさま。記録して終わろう。</p>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={complete}
                  disabled={saving}
                >
                  {saving ? "保存中…" : "完了にする"}
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <nav className="nav">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
          disabled={stepIndex === 0}
        >
          戻る
        </button>
        {isLastStep ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => navigate("/")}
          >
            一覧へ
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              setStepIndex((index) => Math.min(STEPS.length - 1, index + 1))
            }
          >
            次へ
          </button>
        )}
      </nav>
    </main>
  );
}
