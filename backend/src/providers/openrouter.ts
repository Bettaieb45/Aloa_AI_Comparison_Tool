// backend/src/providers/openrouter.ts

import { AIProvider, RunInput, RunResult, ModelConfig } from "./Provider";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

type OpenRouterModel = {
  id: string;
  name?: string;
  pricing?: {
    prompt?: string;       // USD per token
    completion?: string;   // USD per token
  };
};

export const openRouterProvider: AIProvider = {
  id: "openrouter",

  models: [],

  /**
   * Explicitly load all available OpenRouter models.
   * This is called by the /providers endpoint.
   */
  async loadModels(): Promise<void> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Prevent refetching if already loaded
    if (this.models.length > 0) return;

    const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch OpenRouter models");
    }

    const data = await res.json();

    this.models = data.data.map((model: OpenRouterModel): ModelConfig => ({
      id: model.id,
      label: model.name ?? model.id,
      // pricing metadata only — not forced
      pricePer1kTokensUsd: model.pricing?.prompt
        ? Number(model.pricing.prompt) * 1000
        : 0
    }));
  },

  /**
   * Execute a prompt against a selected OpenRouter model
   */
  async run(input: RunInput): Promise<RunResult & { costUsd?: number }> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Ensure models are available (safety check)
    if (this.models.length === 0) {
        await this.loadModels?.();
        }


    const start = Date.now();

    const response = await fetch(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "AI Comparison Tool"
        },
        body: JSON.stringify({
          model: input.model,
          messages: [
            { role: "user", content: input.prompt }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${errorText}`);
    }

    const data = await response.json();

    const latencyMs = Date.now() - start;

    const output =
      data.choices?.[0]?.message?.content ?? "No output returned";

    let costUsd: number | undefined;

    if (data.usage && data.model) {
      const model = this.models.find(m => m.id === data.model);

      const promptTokens = data.usage.prompt_tokens ?? 0;
      const completionTokens = data.usage.completion_tokens ?? 0;

      if (model?.pricePer1kTokensUsd) {
        costUsd =
          ((promptTokens + completionTokens) / 1000) *
          model.pricePer1kTokensUsd;
      }
    }

    return {
      output,
      latencyMs,
      tokenUsage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens
          }
        : undefined,
      ...(costUsd !== undefined ? { costUsd } : {})
    };
  }
};
