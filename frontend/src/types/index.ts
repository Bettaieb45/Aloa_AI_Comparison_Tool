export type ProviderModel = {
  id: string;
  label: string;
  pricePer1kTokensUsd?: number;
};

export type Provider = {
  id: string;
  models: ProviderModel[];
};

export type RunResult = {
  output: string;
  latencyMs: number;
  ttftMs: number | null;
  costUsd: number | null;
};
