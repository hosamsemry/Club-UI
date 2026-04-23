# Club Management Frontend

React + TypeScript dashboard for the Club Management platform.

It connects to the Django API in the sibling `api` folder and provides role-based workflows for operations like inventory, ticketing, reservations, sales, reporting, and user administration.

## Features

- JWT-based authentication (login/register) with auto token refresh.
- Role-aware navigation and default landing routes (`owner`, `manager`, `cashier`, `staff`).
- Inventory management: categories, products, stock movements, low-stock visibility.
- Event reservations with payment recording and cancellation flows.
- Ticketing flows: ticket types, entry days, sell tickets, check-in, ticket list.
- Sales and transactions screens, plus reporting and audit views.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Redux Toolkit + RTK Query
- React Router 7
- Tailwind CSS 4
- React Hook Form + Zod

## Project Structure

```text
club/
├── src/
│   ├── api/           # RTK Query API slice and endpoints
│   ├── app/           # Redux store and shared app hooks
│   ├── components/    # Layout and reusable UI components
│   ├── features/      # Domain features (auth, products, tickets, etc.)
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Shared helpers/utilities
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Auth, roles, and utility functions
├── public/
└── package.json
```

## Prerequisites

- Node.js 20+
- npm 10+
- Running backend API (default: `http://127.0.0.1:8000`)

## Environment Variables

Create a `.env` file in this folder (or copy from `.env.example`):

```bash
cp .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Getting Started

```bash
npm install
npm run dev
```

The app starts on Vite's default dev server (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` — start development server
- `npm run build` — type-check and create production build
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

## Docker

The frontend repo includes its own `docker-compose.yml` for the production-style frontend container.

### Included Service

- `frontend`: React app built with Vite and served by Nginx on `http://localhost:5173`

### Start

Start the backend stack in `api/` first so the shared Docker network `club-network` already exists.

Then, from the `club/` folder:

```bash
docker compose up --build
```

### Stop

From the `club/` folder:

```bash
docker compose down
```

### How It Connects To The Backend

- Nginx proxies `/api/` and `/media/` to the backend container at `http://backend:8000`
- `VITE_API_BASE_URL` is set to an empty string in Docker so browser requests stay on the frontend origin
- Because of that proxy setup, the browser only needs to access `http://localhost:5173`

## Backend Integration

- API base URL is read from `VITE_API_BASE_URL`.
- Most API calls are centralized in `src/api/apiSlice.ts`.
- Login posts to `/api/token/`, and refresh uses `/api/token/refresh/`.

## Roles and Access

The UI is role-aware and gates screens by permissions. Default routes:

- `owner`, `manager` → `/dashboard`
- `cashier` → `/products`
- `staff` → `/tickets/check-in`
