# Plan de trabajo — Postgres con Docker y conexión Backend/Frontend

Objetivo

- Levantar una base de datos Postgres local (contenedor Docker) y preparar el backend para usarla, ejecutar el script de inicialización `backend/src/infrastructure/database/init.sql`, y conectar el frontend al backend real (sin mock).

Alcance

- Crear y arrancar Postgres con Docker
- Configurar `DATABASE_URL` en `backend/.env`
- Aplicar `init.sql` mediante la ruta `POST /api/database/bootstrap` del backend
- Deshabilitar el mock de Vite o configurar `VITE_API_BASE`
- Validación y pruebas ligeras de integración

Requisitos previos

- Docker y Docker Compose instalados en el entorno de desarrollo
- `pnpm` o `npm` disponible
- Estar en la rama: `ch/clean-architecture/database`

Precauciones

- No subir credenciales a Git. Añadir `backend/.env` a `.gitignore`.
- Asegúrate de que el puerto `5432` esté libre o elige otro puerto y ajusta `DATABASE_URL`.

---

Fases del plan

## Fase 0 — Preparación (1 día)

- Objetivo: validar prerrequisitos y preparar el repositorio.
- Tareas:
  1. Confirmar acceso al repo y rama: `git status && git branch --show-current`.
  2. Revisar `backend/src/infrastructure/database/init.sql` para conocer la estructura y seed de datos.
  3. Añadir `backend/.env` a `.gitignore` si no está.

Criterio de salida: entorno preparado, `init.sql` revisado.

## Fase 1 — Crear configuración Docker (0.5 día)

- Objetivo: añadir un `docker-compose.yml` mínimo para Postgres.
- Tareas:
  1. Crear `docker-compose.yml` con servicio `postgres:15` y variables: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
  2. Revisar puertos, volúmenes y salud del servicio.

Ejemplo de variables esperadas (no lo subas al repo):

- POSTGRES_USER=devuser
- POSTGRES_PASSWORD=devpass
- POSTGRES_DB=crm_sign_medios

Criterio de salida: `docker-compose.yml` presente y listo para levantar.

## Fase 2 — Levantar Postgres y configurar env (0.25 día)

- Objetivo: arrancar la BD y dejar la cadena `DATABASE_URL` disponible para el backend.
- Tareas:
  1. Ejecutar `docker compose up -d`.
  2. Construir la cadena `DATABASE_URL`:

   postgres://devuser:devpass@localhost:5432/crm_sign_medios

  3. Crear `backend/.env` con `DATABASE_URL` y otras variables (p.ej. `PORT=3000`).
  4. Verificar conexión con `psql` o herramientas GUI (opcional).

Criterio de salida: BD accesible desde host y `DATABASE_URL` configurada en `backend/.env`.

## Fase 3 — Inicializar la base y levantar backend (0.5 día)

- Objetivo: aplicar `init.sql` y arrancar backend apuntando a la BD.
- Tareas:
  1. Desde `backend/` instalar dependencias: `pnpm install`.
  2. Levantar backend en dev: `pnpm dev`.
  3. Ejecutar bootstrap: `POST http://localhost:3000/api/database/bootstrap` (o invocar localmente `initializeDatabase()` si prefieres).
  4. Verificar estado: `GET /api/database/status` debe reportar tablas existentes.

Criterio de salida: tablas creadas y seed insertado; `GET /api/health` y `/api/database/status` OK.

## Fase 4 — Conectar frontend y deshabilitar mock (0.25 día)

- Objetivo: que la UI consuma datos reales del backend.
- Tareas:
  1. Opción A (preferida): crear `.env` del frontend o establecer `VITE_API_BASE=http://localhost:3000/api`.
  2. Opción B: comentar o desactivar el plugin `mock-dashboard-api` en `vite.config.ts`.
  3. Reiniciar el frontend `pnpm dev` y navegar la UI.

Criterio de salida: las llamadas `/api` provienen del backend real (no del mock).

## Fase 5 — Pruebas y ajuste final (0.5 día)

- Objetivo: validar flujos clave y corregir incompatibilidades.
- Tareas:
  1. Ejecutar tests del backend: `npm run test` y `npm run test:integration` desde `backend/`.
  2. Probar manualmente: carga de dashboard, abrir chat, enviar intervención, enviar webhook simulado.
  3. Si hay discrepancias en los contratos, ajustar la capa de servicios del frontend (`src/app/services/dashboardApi.ts`) o el adaptador del backend.
  4. Registrar errores y corregir adaptadores.

Criterio de salida: tests pasan y flujo manual validado.

## Fase 6 — Limpieza y documentación (0.25 día)

- Objetivo: dejar todo documentado y reproducible.
- Tareas:
  1. Añadir instrucción en `README.md` o crear `docs/` con pasos para levantar la BD y conectar el proyecto.
  2. Añadir notas para CI (si corresponde) sobre cómo ejecutar `init.sql` en despliegue.
  3. Confirmar que no se subieron credenciales.

Criterio de salida: documentación disponible y entorno listo para otros desarrolladores.

---

Comandos útiles (resumen)

```bash
# desde la raíz del proyecto
cd crm_sign_medios01

# levantar Postgres (desde la carpeta donde esté docker-compose.yml)
docker compose up -d

# en backend/
pnpm install
pnpm dev

# aplicar init (desde una terminal o cliente HTTP)
curl -X POST http://localhost:3000/api/database/bootstrap

# tests de integración (backend)
cd backend
npm run test:integration
```

Validación final

- `GET http://localhost:3000/api/health` → success
- `GET http://localhost:3000/api/database/status` → conectado y tablas existentes
- UI: el dashboard carga datos reales; chats muestran mensajes y las intervenciones se persisten

---

Notas adicionales

- Si prefieres que yo cree `docker-compose.yml`, arranque el contenedor y aplique `init.sql`, confirmalo y lo hago (necesitaré permiso para ejecutar Docker en este entorno).
- Si no puedes usar Docker, me indicas la cadena `DATABASE_URL` de la instancia que prefieras usar.

