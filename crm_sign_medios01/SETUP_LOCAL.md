# 🚀 Setup Local - Backend, Frontend y Base de Datos

Este documento describe cómo ejecutar la stack completa localmente: Frontend, Backend y PostgreSQL.

## 📋 Requisitos Previos

- Node.js 18+ y npm/pnpm
- Docker y Docker Compose
- Terminal con acceso a múltiples pestañas/splits (recomendado)

## 🏗️ Arquitectura Local

```
┌─────────────────────────────────────────────┐
│         Frontend (Vite)                      │
│       http://localhost:5173                  │
│  (Desarrollado en src/)                      │
└──────────────┬──────────────────────────────┘
               │
               │ Solicitudes HTTP
               │ VITE_API_BASE=http://localhost:3000/api
               ▼
┌─────────────────────────────────────────────┐
│      Backend (Express + Node.ts)             │
│       http://localhost:3000                  │
│  (Desarrollado en backend/src/)              │
└──────────────┬──────────────────────────────┘
               │
               │ Conexión Postgres
               │ DATABASE_URL=postgres://user:password@localhost:5432/crm_sign_medios
               ▼
┌─────────────────────────────────────────────┐
│     PostgreSQL (Docker)                      │
│        localhost:5432                        │
│  (Base de datos crm_sign_medios)             │
└─────────────────────────────────────────────┘
```

## 🚦 Pasos para Ejecutar

### 1️⃣ Instalar Dependencias

En la raíz del proyecto:

```bash
pnpm install
```

Esto instalará las dependencias del workspace, incluyendo:
- `backend/` - Backend Node.js
- `src/` - Frontend React/Vite

### 2️⃣ Iniciar PostgreSQL con Docker

En la raíz del proyecto:

```bash
docker-compose up -d
```

Verifica que PostgreSQL está ejecutándose:

```bash
docker-compose ps
```

Deberías ver:

```
NAME                 IMAGE             STATUS
crm-sign-postgres    postgres:15...    Up (healthy)
```

### 3️⃣ Iniciar el Backend (Terminal 1)

```bash
cd backend
pnpm dev
```

Deberías ver:

```
✅ Database initialized successfully
✅ Server running on http://localhost:3000
```

### 4️⃣ Iniciar el Frontend (Terminal 2)

```bash
pnpm dev
```

Vite iniciará el frontend, típicamente en:

```
➜  Local:   http://localhost:5173/
```

## ✅ Verificar que Todo Funciona

1. Abre tu navegador en `http://localhost:5173`
2. Deberías ver la aplicación cargada
3. Intenta hacer login - las solicitudes irán a `http://localhost:3000/api`
4. Revisa la consola del backend para ver las solicitudes

## 📝 Variables de Entorno

### Raíz del Proyecto (`.env`)

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=crm_sign_medios
POSTGRES_PORT=5432
DATABASE_URL=postgres://user:password@localhost:5432/crm_sign_medios
VITE_API_BASE=http://localhost:3000/api
VITE_API_PROXY_TARGET=http://localhost:3000
```

### Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/crm_sign_medios
JWT_SECRET=dev-secret
...
```

## 🔧 Troubleshooting

### ❌ "Connection refused" desde el Backend a PostgreSQL

**Síntoma:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solución:**
```bash
# Verifica que Docker está corriendo
docker-compose ps

# Reinicia PostgreSQL
docker-compose restart postgres

# Verifica la conexión
docker-compose exec postgres pg_isready -U user -d crm_sign_medios
```

### ❌ "Cannot POST /api/..." desde el Frontend

**Síntoma:** Error 404 o CORS al intentar conectar desde el frontend

**Soluciones:**
1. Verifica que el backend está corriendo en `http://localhost:3000`
2. Asegúrate que `VITE_API_BASE=http://localhost:3000/api` en `.env`
3. Revisa la consola del navegador para ver el error exacto

### ❌ Puerto 5432 o 3000 ya está en uso

```bash
# Encontrar qué proceso usa el puerto
lsof -i :5432  # Para PostgreSQL
lsof -i :3000  # Para Backend
lsof -i :5173  # Para Frontend

# Matar el proceso (reemplazar PID)
kill -9 <PID>
```

### ❌ Cambios en el código no se reflejan

- **Backend:** Debería auto-recargar con `tsx watch` (verifica que está corriendo correctamente)
- **Frontend:** Vite debería hacer hot-reload automático

## 🛑 Detener los Servicios

```bash
# Detener PostgreSQL
docker-compose down

# Detener Backend y Frontend: Ctrl+C en cada terminal
```

## 📚 Estructura del Proyecto

```
crm_sign_medios01/
├── backend/                 # Backend Node.js/Express
│   ├── src/
│   │   ├── main.ts         # Entry point
│   │   ├── interface/      # Controllers/DTOs
│   │   ├── application/    # Business logic
│   │   ├── domain/         # Entities/Models
│   │   └── infrastructure/ # Database/External services
│   └── .env               # Variables de entorno local
│
├── src/                    # Frontend React/Vite
│   ├── app/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   └── services/      # API client (apiClient.ts)
│   └── main.tsx
│
├── .env                   # Variables compartidas
├── docker-compose.yml     # Solo PostgreSQL
└── pnpm-workspace.yaml    # Workspace monorepo
```

## 🔐 Credenciales por Defecto

```
DB User: user
DB Password: password
DB Name: crm_sign_medios
DB Host: localhost:5432
JWT Secret: dev-secret
```

⚠️ **Nota:** Estas son solo credenciales de desarrollo. Cambia en producción.

## 🚀 Siguientes Pasos

- Revisa [Backend-Implementation-Plan.md](./Backend-Implementation-Plan.md) para endpoints disponibles
- Revisa [Dashboard-Database-Integration-Plan.md](./Dashboard-Database-Integration-Plan.md) para integración del dashboard
- Lee el [README.md](./README.md) principal del proyecto
