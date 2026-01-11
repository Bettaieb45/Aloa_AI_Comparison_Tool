# Frontend

React + Vite UI for the AI comparison tool.

## Prerequisites
- Node.js 18+ (or 20+ recommended)
- npm (comes with Node)

## Install
From the repository root:

```bash
cd frontend
npm install
```

## Configure
The frontend expects the backend API at `http://localhost:3001` by default.
To point it elsewhere, set `VITE_API_BASE`:

```bash
export VITE_API_BASE="http://localhost:3001"
```

Or create a `frontend/.env` file:

```bash
VITE_API_BASE=http://localhost:3001
```

## Run (development)

```bash
cd frontend
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
cd frontend
npm run build
```

## Preview the production build

```bash
cd frontend
npm run preview
```

## Lint

```bash
cd frontend
npm run lint
```

## Usage
- Ensure the backend is running and reachable at `VITE_API_BASE`.
- Use the prompt box to enter text and click "Run all" to compare models.
- Add or remove columns to compare multiple providers/models side-by-side.
