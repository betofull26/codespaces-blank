# CRM Sign Medios Backend

Backend inicial en Node.js + Express con una estructura modular basada en Clean Architecture.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`

## Variables de entorno

Create `backend/.env` with:

```env
DATABASE_URL=postgres://devuser:devpass@localhost:5432/crm_sign_medios
PORT=3000
```

> `backend/.env` is gitignored by design.

## Inicialización de la base de datos

After starting the backend, run:

```bash
curl -X POST http://localhost:3000/api/database/bootstrap
```

Then verify the service and database status:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/database/status
```

## CI / Deployment notes

- Use a CI secret for `DATABASE_URL`.
- Ensure the target database is available before startup.
- The backend exposes a bootstrap endpoint that applies `backend/src/infrastructure/database/init.sql`.
- Do not store real credentials in the repository.
