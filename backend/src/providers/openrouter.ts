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
    let firstTokenAt: number | null = null;
    let output = "";
    let usage:
      | { prompt_tokens?: number; completion_tokens?: number }
      | undefined;

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
          stream: true,
          stream_options: { include_usage: true },
          messages: [{ role: "user", content: input.prompt }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${errorText}`);
    }

    if (!response.body) {
      throw new Error("OpenRouter response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;

      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      let lineBreakIndex = buffer.indexOf("\n");
      while (lineBreakIndex !== -1) {
        const line = buffer.slice(0, lineBreakIndex).trim();
        buffer = buffer.slice(lineBreakIndex + 1);
        lineBreakIndex = buffer.indexOf("\n");

        if (!line.startsWith("data:")) {
          continue;
        }

        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(data);
          const delta =
            parsed.choices?.[0]?.delta?.content ??
            parsed.choices?.[0]?.message?.content ??
            "";

          if (delta) {
            if (firstTokenAt === null) {
              firstTokenAt = Date.now();
            }
            output += delta;
          }

          if (parsed.usage) {
            usage = parsed.usage;
          }
        } catch {
          // Ignore malformed stream chunks.
        }
      }
    }

    if (buffer.trim().startsWith("data:")) {
      const data = buffer.trim().slice(5).trim();
      if (data && data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data);
          const delta =
            parsed.choices?.[0]?.delta?.content ??
            parsed.choices?.[0]?.message?.content ??
            "";

          if (delta) {
            if (firstTokenAt === null) {
              firstTokenAt = Date.now();
            }
            output += delta;
          }

          if (parsed.usage) {
            usage = parsed.usage;
          }
        } catch {
          // Ignore malformed stream chunks.
        }
      }
    }

    const latencyMs = Date.now() - start;
    const ttftMs = firstTokenAt ? firstTokenAt - start : null;

    let costUsd: number | undefined;

    if (usage) {
      const model = this.models.find(m => m.id === input.model);

      const promptTokens = usage.prompt_tokens ?? 0;
      const completionTokens = usage.completion_tokens ?? 0;

      if (model?.pricePer1kTokensUsd) {
        costUsd =
          ((promptTokens + completionTokens) / 1000) *
          model.pricePer1kTokensUsd;
      }
    }

    return {
      output: output || "No output returned",
      latencyMs,
      ttftMs,
      tokenUsage: usage
        ? {
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0
          }
        : undefined,
      ...(costUsd !== undefined ? { costUsd } : {})
    };
  }
};
