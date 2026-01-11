type Props = {
  value: string;
  onChange: (v: string) => void;
  onRunAll: () => void;
  disabled: boolean;
};

export default function PromptInput({
  value,
  onChange,
  onRunAll,
  disabled,
}: Props) {
  return (
    <div className="prompt-bar">
      <div className="prompt-field">
        <label htmlFor="prompt-input">Prompt</label>
        <textarea
          id="prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write a prompt to compare AI models..."
          rows={5}
        />
      </div>
      <div className="prompt-actions">
        <button
          className="run-all"
          disabled={!value || disabled}
          onClick={onRunAll}
        >
          Run All
        </button>
        <span className="hint">
          Tip: keep prompts short for faster comparisons.
        </span>
      </div>
    </div>
  );
}
