import { useState } from "react";
import type { RunResult } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
type RunResponse = {
  output: string;
  metrics: {
    latencyMs: number;
    ttftMs: number | null;
    costUsd: number | null;
  };
};

export function useModelRunner() {
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(providerId: string, modelId: string, prompt: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          model: modelId,
          prompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Run failed");
      }

      const data: RunResponse = await res.json();
      setResult({
        output: data.output,
        latencyMs: data.metrics.latencyMs,
        ttftMs: data.metrics.ttftMs,
        costUsd: data.metrics.costUsd,
      });
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return { run, result, loading, error };
}
