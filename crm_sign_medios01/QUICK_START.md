# ⚡ Inicio Rápido - 3 Pasos

## Requisito Previo
Asegúrate de que Docker está corriendo en tu máquina.

## Paso 1: Instalar y Preparar (Una sola vez)
```bash
cd crm_sign_medios01

# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
start.bat
```

Este script:
- ✅ Instala las dependencias del proyecto
- ✅ Levanta PostgreSQL en Docker
- ✅ Verifica que todo está listo

## Paso 2: Iniciar el Backend (Terminal 1)
```bash
cd backend
pnpm dev
```

Espera hasta ver:
```
✅ Database initialized successfully
✅ Server running on http://localhost:3000
```

## Paso 3: Iniciar el Frontend (Terminal 2)
```bash
pnpm dev
```

Vite dirá algo como:
```
➜  Local:   http://localhost:5173/
```

## ✅ ¡Listo!
Abre tu navegador en `http://localhost:5173` y comienza a desarrollar.

---

## 🛑 Para Detener Todo

```bash
# Detener Backend y Frontend: Ctrl+C en cada terminal

# Detener PostgreSQL
docker-compose down
```

---

## 📚 Para Más Detalles
Lee el archivo **SETUP_LOCAL.md** con toda la documentación completa.
