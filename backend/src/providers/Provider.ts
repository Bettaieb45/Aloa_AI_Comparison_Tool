// backend/src/providers/Provider.ts

export type ModelConfig = {
  id: string;
  label: string;
  pricePer1kTokensUsd?: number;
};

export type RunInput = {
  prompt: string;
  model: string;
};

export type RunResult = {
  output: string;
  latencyMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
  };
};

export interface AIProvider {
  /**
   * Unique provider identifier
   * e.g. "openrouter", "vercel"
   */
  id: string;

  /**
   * Models supported by this provider
   */
  models: ModelConfig[];

  /**
   * Execute a prompt against a specific model
   */
  run(input: RunInput): Promise<RunResult>;
  /**
   * Optional hook to load models dynamically
   */
  loadModels?(): Promise<void>;
}
