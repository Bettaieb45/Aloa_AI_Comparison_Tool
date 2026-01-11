import { useEffect } from "react";
import type { Provider } from "../types";
import { useModelRunner } from "../hooks/useModelRunner";
import ModelSelector from "./ModelSelector";
import MetricsPanel from "./MetricsPanel";

type Props = {
  providers: Provider[];
  providerId: string;
  modelId: string;
  prompt: string;
  onChange: (patch: { providerId?: string; modelId?: string }) => void;
  onRemove: () => void;
  registerRun: (fn: () => void) => () => void;
};

export default function ModelColumn({
  providers,
  providerId,
  modelId,
  prompt,
  onChange,
  onRemove,
  registerRun,
}: Props) {
  const { run, result, loading, error } = useModelRunner();

  // expose run() to Run All
  useEffect(() => registerRun(() => run(providerId, modelId, prompt)), [
    registerRun,
    run,
    providerId,
    modelId,
    prompt,
  ]);

  return (
    <div className="model-card">
      <div className="card-header">
        <div className="card-title">Model Run</div>
        <button className="ghost-btn" onClick={onRemove}>
          Remove
        </button>
      </div>
      <ModelSelector
        providers={providers}
        providerId={providerId}
        modelId={modelId}
        onProviderChange={(id) => {
          const nextModel =
            providers.find((p) => p.id === id)?.models[0]?.id ??
            modelId;
          onChange({ providerId: id, modelId: nextModel });
        }}
        onModelChange={(id) => onChange({ modelId: id })}
      />

      <button
        className="run-btn"
        disabled={!prompt || loading}
        onClick={() => run(providerId, modelId, prompt)}
      >
        {loading ? "Running…" : "Run"}
      </button>

      <div className="output">
        {error && <div className="error">{error}</div>}
        {result?.output || "Model output will appear here"}
      </div>

      {result && <MetricsPanel result={result} />}
    </div>
  );
}
