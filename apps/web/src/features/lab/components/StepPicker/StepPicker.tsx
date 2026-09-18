import type { StepStatus } from "@/features/lab/hooks/useLabSession";

// Presentational: the four steps, with where the session has reached.

export type StepPickerProps = {
  steps: StepStatus[];
  onSelect: (index: number) => void;
};

export function StepPicker({ steps, onSelect }: StepPickerProps) {
  return (
    <nav className="steppick" aria-label="ステップを選ぶ">
      {steps.map((step) => (
        <button
          key={step.index}
          type="button"
          className={[
            "steppick__item",
            step.done && "steppick__item--done",
            step.current && "steppick__item--current",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelect(step.index)}
          aria-current={step.current ? "step" : undefined}
        >
          <span className="steppick__dot" aria-hidden="true">
            {step.done ? "✓" : step.index + 1}
          </span>
          <span className="steppick__label">{step.title}</span>
        </button>
      ))}
    </nav>
  );
}
