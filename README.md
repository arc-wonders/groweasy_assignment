# GrowEasy Assignment

AI-powered CSV importer for mapping uploaded lead data into a CRM-friendly schema.

## Deployed App

Frontend:

https://groweasy-assignment-iota.vercel.app/

Backend health check:

https://groweasy-assignment-2753.onrender.com/health

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS, PapaParse
- Backend: Node.js, Express, TypeScript
- AI provider: OpenRouter via the OpenAI SDK

## Project Structure

```text
.
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── prompts
│   │   ├── routes
│   │   ├── services
│   │   └── utils
│   └── package.json
├── frontend
│   ├── app
│   └── package.json
├── example.csv
└── check_backend_live.py
```

## Local Setup

Requirements:

- Node.js 18+
- npm
- Python 3, optional for the backend health-check script

## Backend

Create `backend/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=mistralai/ministral-14b-2512
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PORT=4000
```

Install dependencies:

```bash
cd backend
npm install
```

Run locally:

```bash
npm run dev
```

Build and start production locally:

```bash
npm run build
npm start
```

The backend runs at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/health
```

## Frontend

Create `frontend/.env.local`:

```env
BACKEND_API_URL=http://localhost:4000
```

Install dependencies:

```bash
cd frontend
npm install
```

Run locally:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Test With Example CSV

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:3000`.
4. Upload `example.csv`.
5. Click `Confirm Import`.

## Check Deployed Backend

Run:

```bash
python check_backend_live.py
```

Expected successful output includes:

```text
Backend is live.
```

## Deployment Settings

### Backend on Render

Use a Web Service.

```text
Root Directory: backend
Framework Preset: Node
Install Command: npm install
Build Command: npm run build
Start Command: npm start
```

Environment variables:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=mistralai/ministral-14b-2512
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Frontend on Vercel

Use the `frontend` directory as the project root.

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Environment variable:

```env
BACKEND_API_URL=https://groweasy-assignment-2753.onrender.com
```

## API Endpoints

### `GET /health`

Returns backend status:

```json
{
  "status": "ok"
}
```

### `POST /import`

Request body:

```json
{
  "rows": [
    {
      "Customer Name": "John Doe",
      "Contact Number": "+91 9876543210",
      "Mail ID": "john@example.com"
    }
  ]
}
```

Response:

```json
{
  "imported": [],
  "skipped": [],
  "totalImported": 0,
  "totalSkipped": 0
}
```
