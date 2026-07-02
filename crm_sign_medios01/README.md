# Modern Login Screen UI

This is a code bundle for Modern Login Screen UI. The original project is available at https://www.figma.com/design/TPpCtX0oIN42Sa4qBAbGz/Modern-Login-Screen-UI.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Local backend + database setup

This repository includes a backend service and a local Postgres database workflow.

### 1. Start Postgres

From the repository root:

```bash
docker compose up -d
```

This uses the local `docker-compose.yml` service and exposes Postgres on `localhost:5432`.

### 2. Configure backend environment

Create `backend/.env` with these values:

```env
DATABASE_URL=postgres://devuser:devpass@localhost:5432/crm_sign_medios
PORT=3000
```

> `backend/.env` is ignored by git through `.gitignore`.

### 3. Initialize the database

From `crm_sign_medios01/backend`:

```bash
pnpm install
pnpm dev
```

Then bootstrap the database schema and seed data:

```bash
curl -X POST http://localhost:3000/api/database/bootstrap
```

Verify the backend and database status:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/database/status
```

### 4. Connect the frontend to the real backend

Create a root `.env` file with:

```env
VITE_API_BASE=http://localhost:3000/api
VITE_USE_MOCK_API=false
```

Then start the frontend:

```bash
pnpm dev
```

### 5. CI / deployment notes

- Store `DATABASE_URL` as a secret in CI.
- Ensure the database is available before backend startup.
- Once the backend is running, apply schema initialization with `POST /api/database/bootstrap`.
- Do not commit `.env` files; `/.env` and `backend/.env` are ignored.
