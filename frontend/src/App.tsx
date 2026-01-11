import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import PromptInput from "./components/PromptInput";
import ModelColumn from "./components/ModelColumn";
import type { Provider } from "./types";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

type ColumnConfig = {
  id: string;
  providerId: string;
  modelId: string;
};

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runCallbacks = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await fetch(`${API_BASE}/providers`);
        if (!res.ok) throw new Error("Failed to load providers");

        const raw = await res.json();
        const providersArray: Provider[] = Object.values(raw);

        if (!providersArray.length) {
          throw new Error("Providers list is empty");
        }

        setProviders(providersArray);

        const firstProvider = providersArray[0];
        const firstModel = firstProvider.models[0];

        if (!firstModel) {
          throw new Error("No models available for the first provider");
        }

        setColumns([
          {
            id: crypto.randomUUID(),
            providerId: firstProvider.id,
            modelId: firstModel.id,
          },
          {
            id: crypto.randomUUID(),
            providerId: firstProvider.id,
            modelId: firstModel.id,
          },
        ]);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadProviders();
  }, []);

  function registerRun(id: string, fn: () => void) {
    runCallbacks.current.set(id, fn);
    return () => runCallbacks.current.delete(id);
  }

  function addColumn() {
    if (!providers.length) return;
    const provider = providers[0];
    const model = provider.models[0];
    if (!model) return;

    setColumns((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        providerId: provider.id,
        modelId: model.id,
      },
    ]);
  }

  function updateColumn(id: string, patch: Partial<ColumnConfig>) {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function removeColumn(id: string) {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    runCallbacks.current.delete(id);
  }

  function runAll() {
    runCallbacks.current.forEach((run) => run());
  }

  const totalModels = providers.reduce(
    (sum, provider) => sum + provider.models.length,
    0
  );

  if (loading) {
    return (
      <div className="page">
        <div className="status">Loading providers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="status error">
          <strong>Backend error</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">AI Comparison Tool</p>
          <h1>Compare models side-by-side with real metrics.</h1>
          <p className="subhead">
            Pulls providers and models from the backend, then runs your prompt
            across multiple configurations.
          </p>
        </div>
        <div className="hero-stats">
          <div>
            <span className="stat-label">Providers</span>
            <span className="stat-value">{providers.length}</span>
          </div>
          <div>
            <span className="stat-label">Models</span>
            <span className="stat-value">{totalModels}</span>
          </div>
        </div>
      </header>

      <PromptInput
        value={prompt}
        onChange={setPrompt}
        onRunAll={runAll}
        disabled={!columns.length}
      />

      <section className="board">
        {columns.map((col, index) => (
          <div
            key={col.id}
            className="card-wrapper"
            style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
          >
            <ModelColumn
              providers={providers}
              providerId={col.providerId}
              modelId={col.modelId}
              prompt={prompt}
              onChange={(patch) => updateColumn(col.id, patch)}
              onRemove={() => removeColumn(col.id)}
              registerRun={(fn) => registerRun(col.id, fn)}
            />
          </div>
        ))}

        <button className="add-card" onClick={addColumn}>
          <span className="plus">+</span>
          Add model
        </button>
      </section>
    </div>
  );
}
