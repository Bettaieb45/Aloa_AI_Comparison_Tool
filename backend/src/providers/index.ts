import { AIProvider } from "./Provider";
import { openRouterProvider } from "./openrouter";
import { vercelProvider } from "./vercel";

export const providers: Record<string, AIProvider> = {
  openrouter: openRouterProvider,
  vercel: vercelProvider
};
