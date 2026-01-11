import { Router } from "express";
import { providers } from "../providers";
import { AIProvider } from "../providers/Provider";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const response: Record<
      string,
      {
        id: string;
        models: {
          id: string;
          label: string;
          pricePer1kTokensUsd?: number;
        }[];
      }
    > = {};

    for (const [providerId, provider] of Object.entries(providers)) {
      const typedProvider = provider as AIProvider;

      // Explicit, non-hacky model loading
      if (typeof typedProvider.loadModels === "function") {
        await typedProvider.loadModels();
      }

      response[providerId] = {
        id: typedProvider.id,
        models: typedProvider.models
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Failed to load providers:", error);
    res.status(500).json({
      error: "Failed to load providers"
    });
  }
});

export default router;
