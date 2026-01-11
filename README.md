# AI Comparison Tool

Compare multiple AI models side-by-side with a single prompt. This repo is split
into a frontend UI and a backend API so each layer stays focused, testable, and
easy to deploy independently.

## Project Overview
- **Frontend (Vite + React + TypeScript):** fast local dev, small bundle size,
  and a clear component-based UI for comparisons.
- **Backend (Express + TypeScript):** simple HTTP API that hides provider
  differences, normalizes pricing/metrics, and keeps secrets off the client.

## Why The Repo Is Structured This Way
- **Separation of concerns:** UI focuses on interaction; API focuses on data and
  provider integrations. This reduces coupling and makes changes safer.
- **Provider abstraction:** each provider lives in its own module to keep API
  logic predictable and to make adding new providers low-risk.
- **Explicit environment config:** API keys and provider URLs stay server-side,
  while the frontend only needs a single `VITE_API_BASE`.
- **Single source of truth for models:** the backend loads and normalizes models
  so the UI can present consistent options regardless of provider quirks.

## Architecture
- **Frontend** calls `GET /providers` to populate model choices.
- **Frontend** calls `POST /run` with a prompt + provider/model.
- **Backend** routes the request to the correct provider, measures latency, and
  returns the output with optional token usage and cost.

## Repository Layout
- `frontend/` React UI (Vite, TypeScript)
- `backend/` Express API (TypeScript)

## Local Development
Run the backend first, then the frontend.

### Backend
```bash
cd backend
npm install
cp .env.example .env  # if you create one
npm run dev
```

Default API URL: `http://localhost:3001`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Default UI URL: `http://localhost:5173`

If the backend runs elsewhere:
```bash
export VITE_API_BASE="http://localhost:3001"
```

## Configuration Choices
- **Vite for frontend:** fast HMR and modern build pipeline without extra
  config.
- **TypeScript everywhere:** shared typing habits reduce runtime mistakes and
  speed up refactors.
- **Express for backend:** minimal surface area with straightforward routing.
- **Provider modules:** each provider handles its own auth and pricing metadata,
  avoiding global conditionals.

## Cost & Metrics
The backend records latency and uses provider metadata to estimate cost when
available. The frontend displays these metrics per run to help compare models
fairly.

## Extending The Project
- Add a new provider by implementing the provider interface in
  `backend/src/providers/`.
- Update the UI by adding new cards/columns in `frontend/src/`.

## Notes
- The UI expects the backend to be reachable at `VITE_API_BASE`.
- API keys must remain in the backend `.env` and never be exposed to the client.
