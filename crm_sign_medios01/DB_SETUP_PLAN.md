# Plan para crear y conectar la base de datos (Postgres)

Objetivo: dejar una base de datos Postgres local que permita al backend persistir `agents`, `conversations`, `messages`, y que el frontend consuma datos reales. El plan cubre opciones, pasos reproducibles, validaciones y recomendaciones.

---

## Resumen rápido

- Opción recomendada: levantar Postgres con Docker (contenedor local) y ejecutar el script de inicialización `backend/src/infrastructure/database/init.sql`.
- Configurar `DATABASE_URL` en `.env` del backend con la cadena de conexión.
- Ejecutar `POST /api/database/bootstrap` o usar script para aplicar `init.sql` (backend ya tiene `initializeDatabase`).
- Deshabilitar el mock de Vite o establecer `VITE_API_BASE=http://localhost:3000/api` para que el frontend use el backend real.

---

## Requisitos previos

- Docker instalado (opcional si vas a usar una instancia remota).
- `pnpm` o `npm` para ejecutar backend/frontend.
- Acceso al repositorio con la rama de trabajo `ch/clean-architecture/database`.

---

## Entidades y tablas mínimas (ya definidas en `init.sql`)

- `agents` (id, name, role, phone, avatar, initials, online)
- `conversations` (id, agent_id, client_name, topic, status, start_time)
- `messages` (id, conversation_id, sender, text, time, source, external_message_id)

> Nota: el `init.sql` existente crea estas tablas y añade datos seed.

---

## Opción A — Recomendado: crear Postgres local con Docker

1. Crear `docker-compose.yml` (opcional) con servicio `postgres` (imagen oficial, p.ej. `postgres:15`).
2. Variables recomendadas:
   - POSTGRES_USER: `devuser`
   - POSTGRES_PASSWORD: `devpass`
   - POSTGRES_DB: `crm_sign_medios`
   - Puerto: `5432:5432` (host:contenedor)
3. Iniciar contenedor `docker compose up -d`.
4. Construir `DATABASE_URL`, p.e.:

   postgres://devuser:devpass@localhost:5432/crm_sign_medios

5. Crear un archivo `.env` en `backend/` (o exportar la variable) con `DATABASE_URL` y otros valores necesarios.
6. Levantar el backend (desde `backend/`):

   pnpm install
   pnpm dev

7. Ejecutar la ruta de bootstrap (si prefieres que el backend aplique `init.sql`):
   - POST `http://localhost:3000/api/database/bootstrap` o ejecutar `initializeDatabase()` desde `main` (el app ya expone la ruta).

---

## Opción B — Usar una base de datos existente (RDS, Cloud SQL, etc.)

1. Proporciona la cadena `DATABASE_URL` (usuario:contraseña@host:puerto/db).
2. Asegura permisos `CREATE TABLE` y `INSERT` para aplicar `init.sql`.
3. Ejecuta los mismos pasos 6 y 7 de la opción A apuntando a la URL remota.

---

## Pasos detallados para integrar backend + frontend

1. Configurar `DATABASE_URL` en `backend/.env`.
2. Desde `backend/` ejecutar `pnpm install` y `pnpm dev`.
3. Llamar a `POST /api/database/bootstrap` para crear tablas y seed (o ejecutar manualmente `init.sql` con psql).
4. Validar `GET /api/database/status` → conectado y tablas existentes.
5. Validar `GET /api/health` → servicio OK.
6. Configurar frontend:
   - Opción preferida: establecer `VITE_API_BASE=http://localhost:3000/api` en el `.env` del frontend (o en `import.meta.env`).
   - Alternativa: deshabilitar o comentar el plugin `mock-dashboard-api` en `vite.config.ts`.
7. Levantar frontend y navegar por UI para verificar carga real de datos.

---

## Tests y validación

- Ejecutar tests unitarios y de integración del backend:

  - Desde `backend/` ejecutar `npm run test:integration` (ya configurado).

- Probar manualmente en la UI: cargar Dashboard, abrir chat de agente, enviar intervención.
- Verificar que los mensajes aparecen en la BD (consultas `SELECT` simples).

---

## Seguridad y limpieza

- No subir credenciales reales al repositorio. Añadir `backend/.env` a `.gitignore` si no está.
- Para limpiar: parar contenedor Docker y eliminar volumenes si no necesitas datos persistentes.

---

## Problemas comunes y soluciones rápidas

- `DATABASE_URL is not configured`: asegúrate de crear `backend/.env` o exportar la variable antes de iniciar la app.
- CORS: si frontend corre en otro origen, habilita CORS en backend (ya está usando `cors()` por defecto).
- Mock de Vite intercepta `/api`: deshabilita `mock-dashboard-api` en `vite.config.ts` para pruebas reales.

---

## Próximos pasos sugeridos (priorizados)

1. Confirmas si quieres que cree la base (prefieres Docker local o una instancia existente).
2. Si eliges Docker, genero `docker-compose.yml` y arranco Postgres, creo `.env` y ejecuto `POST /api/database/bootstrap` para que queden los datos seed.
3. Reiniciamos frontend sin mock y verificamos flujos clave.

---

Archivo de referencia a revisar: `backend/src/infrastructure/database/init.sql` (script de creación y seed).


