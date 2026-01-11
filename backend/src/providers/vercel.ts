import { AIProvider, RunInput, RunResult, ModelConfig } from "./Provider";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

type GatewayModel = {
  id: string;
  name?: string;
  pricing?: {
    input?: string;   // USD per token
    output?: string;  // USD per token
  };
};

export const vercelProvider: AIProvider = {
  id: "vercel",

  models: [],

  // ----------------------------------------
  // Load models + pricing from Gateway
  // ----------------------------------------
  async loadModels(): Promise<void> {
    if (this.models.length > 0) return;

    const res = await fetch(`${AI_GATEWAY_BASE_URL}/models`);
    if (!res.ok) {
      throw new Error("Failed to fetch AI Gateway models");
    }

    const { data } = await res.json();

    this.models = data.map((model: GatewayModel): ModelConfig => ({
      id: model.id,
      label: model.name ?? model.id,
      // normalize to price per 1k tokens (input pricing preferred)
      pricePer1kTokensUsd: model.pricing?.input
        ? Number(model.pricing.input) * 1000
        : undefined
    }));
  },

  // ----------------------------------------
  // Run prompt using Vercel AI SDK
  // ----------------------------------------
  async run(input: RunInput): Promise<RunResult & { costUsd?: number }> {
    if (this.loadModels && this.models.length === 0) {
      await this.loadModels();
    }

    const start = Date.now();

    const result = await generateText({
      model: gateway(input.model),
      prompt: input.prompt
    });

    const latencyMs = Date.now() - start;

    // ✅ SDK-exposed usage (THIS IS THE KEY)
    const promptTokens = result.usage?.inputTokens ?? 0;
    const completionTokens = result.usage?.outputTokens ?? 0;

    let costUsd: number | undefined;

    const modelConfig = this.models.find(m => m.id === input.model);

    if (modelConfig?.pricePer1kTokensUsd) {
      const totalTokens = promptTokens + completionTokens;
      costUsd =
        (totalTokens / 1000) * modelConfig.pricePer1kTokensUsd;
    }

    return {
      output: result.text,
      latencyMs,
      tokenUsage: {
        promptTokens,
        completionTokens
      },
      ...(costUsd !== undefined ? { costUsd } : {})
    };
  }
};
