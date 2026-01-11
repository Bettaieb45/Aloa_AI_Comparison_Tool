# Backend Documentation

Express API that exposes available model providers and runs prompts against
selected models. This backend is designed to be consumed by the frontend
at `http://localhost:5173`.

## Quick Start

1. Create a `.env` in `backend/` with the required keys.
2. Install dependencies.
3. Run the dev server.

```bash
cd backend
npm install
npm run dev
```

Default server URL: `http://localhost:3001`

## Environment Variables

- `OPENROUTER_API_KEY` (required for OpenRouter)
- `AI_GATEWAY_API_KEY` (required for Vercel AI Gateway)
- `PORT` (optional, defaults to `3001`)

## CORS

Only allows requests from `http://localhost:5173` (see `backend/src/index.ts`).

## API Endpoints

### GET /health
Simple liveness check.

Response:
```json
{ "status": "ok" }
```

### GET /providers
Loads models (if needed) for each provider and returns their IDs and model lists.

Response shape:
```json
{
  "openrouter": {
    "id": "openrouter",
    "models": [
      { "id": "openai/gpt-4o-mini", "label": "GPT-4o mini", "pricePer1kTokensUsd": 0.15 }
    ]
  },
  "vercel": {
    "id": "vercel",
    "models": [
      { "id": "openai/gpt-4o-mini", "label": "GPT-4o mini", "pricePer1kTokensUsd": 0.15 }
    ]
  }
}
```

Notes:
- `pricePer1kTokensUsd` is optional and derived from provider metadata.
- Providers are defined in `backend/src/providers/index.ts`.

### POST /run
Runs a prompt on a chosen provider + model.

Request body:
```json
{
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini",
  "prompt": "Write a haiku about TypeScript."
}
```

Response:
```json
{
  "output": "Your model output here...",
  "tokenUsage": {
    "promptTokens": 123,
    "completionTokens": 456
  },
  "metrics": {
    "latencyMs": 1234,
    "ttftMs": 210,
    "costUsd": 0.0012
  }
}
```

Validation errors return HTTP 400:
```json
{ "error": "provider, model and prompt are required" }
```

## Metrics & Cost Calculation

### Latency
- Measured per request inside each provider's `run` method.
- Calculated as `Date.now()` before the provider call and after it finishes.
- Includes network time + provider processing time.

### Time to First Token (TTFT)
- Measured when streaming responses from providers.
- Calculated as the time from request start to the first text delta.
- If a provider does not return deltas, `ttftMs` is `null`.

### Token Usage
- Pulled from the provider response when available.
- OpenRouter uses `usage.prompt_tokens` and `usage.completion_tokens`.
- Vercel AI Gateway uses `result.usage.inputTokens` and `result.usage.outputTokens`.

### Cost
- Returned only when both pricing metadata and token usage are available.
- OpenRouter: `pricePer1kTokensUsd` is derived from model prompt pricing
  (`pricing.prompt` USD per token * 1000). Cost is:
  `(promptTokens + completionTokens) / 1000 * pricePer1kTokensUsd`.
- Vercel AI Gateway: `pricePer1kTokensUsd` is derived from gateway input pricing
  (`pricing.input` USD per token * 1000). Cost uses total tokens
  (input + output) against that rate.
- If pricing is missing, `costUsd` is omitted from the response.

## Providers

### OpenRouter
Source: `backend/src/providers/openrouter.ts`

- Models loaded from `https://openrouter.ai/api/v1/models`
- Requires `OPENROUTER_API_KEY`
- Runs via `POST /chat/completions`
- Calculates cost from prompt + completion tokens and `pricePer1kTokensUsd`

### Vercel AI Gateway
Source: `backend/src/providers/vercel.ts`

- Models loaded from `https://ai-gateway.vercel.sh/v1/models`
- Runs via Vercel AI SDK (`generateText` + `gateway(modelId)`)
- Cost computed using input + output tokens (if pricing exists)

## Request/Response Flow

1. Frontend calls `GET /providers` to populate provider/model dropdowns.
2. User selects provider + model.
3. Frontend calls `POST /run` with prompt and selected options.
4. Response includes `output` and basic metrics for display.

## Common Issues

- Missing `OPENROUTER_API_KEY` will cause OpenRouter calls to fail.
- Provider/model mismatch will return HTTP 400 from `/run`.
*** End Patch
