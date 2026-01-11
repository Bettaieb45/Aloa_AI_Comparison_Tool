import { Router } from "express";
import { providers } from "../providers";
import { RunInput } from "../providers/Provider";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { provider, model, prompt } = req.body as {
      provider?: string;
      model?: string;
      prompt?: string;
    };

    // --- 1. Validate request ---
    if (!provider || !model || !prompt) {
      return res.status(400).json({
        error: "provider, model and prompt are required"
      });
    }

    // --- 2. Resolve provider ---
    const selectedProvider = providers[provider];

    if (!selectedProvider) {
      return res.status(400).json({
        error: `Unknown provider: ${provider}`
      });
    }

    // --- 3. Ensure models are loaded ---
    if (
      selectedProvider.models.length === 0 &&
      typeof selectedProvider.loadModels === "function"
    ) {
      await selectedProvider.loadModels();
    }

    // --- 4. Validate model belongs to provider ---
    const modelExists = selectedProvider.models.some(
      m => m.id === model
    );

    if (!modelExists) {
      return res.status(400).json({
        error: `Model '${model}' is not supported by provider '${provider}'`
      });
    }

    // --- 5. Execute ---
    const result = await selectedProvider.run({
      model,
      prompt
    } as RunInput);

    // --- 6. Normalize response ---
    res.json({
      output: result.output,
      metrics: {
        latencyMs: result.latencyMs,
        costUsd: (result as any).costUsd ?? null
      }
    });
  } catch (error: any) {
    console.error("Run failed:", error);

    res.status(500).json({
      error: error.message || "Execution failed"
    });
  }
});

export default router;
