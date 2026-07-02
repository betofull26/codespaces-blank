# Plan de integración Frontend - Backend

Este documento describe las fases y pasos para integrar el frontend existente con el backend refactorizado en la rama `ch/clean-architecture/database`.

## Objetivo

Conectar el frontend a la nueva arquitectura de backend sin rehacer la lógica de UI, usando el backend como fuente única de datos y servicios.

## Fase 1 — Preparación del entorno

1. Confirmar que estás en la rama local correcta:
   - `ch/clean-architecture/database`
2. Asegurar que el backend compila y corre:
   - `cd backend && pnpm install`
   - `cd backend && pnpm run build`
   - `cd backend && pnpm dev`
3. Asegurar que el frontend también puede arrancar en paralelo:
   - `cd src` o carpeta raíz del frontend
   - `pnpm install` si hace falta
   - `pnpm dev`
4. Verificar las rutas del backend expuestas:
   - `GET /api/health`
   - `GET /api/database/status`
   - `POST /api/database/bootstrap`

## Fase 2 — Auditoría de APIs y servicios del frontend

1. Revisar los archivos de servicios del frontend que llaman al backend.
2. Identificar los endpoints actuales usados por el frontend.
3. Mapear esos endpoints a los nuevos endpoints del backend con prefijo `/api`.
4. Confirmar los formatos de request y response esperados por frontend y backend.

## Fase 3 — Ajuste de servicios del frontend

1. Actualizar las URL de las llamadas HTTP del frontend para que apunten al backend local.
2. Si el frontend usa un cliente API centralizado, cambiar allí la base URL a `http://localhost:3000/api`.
3. Validar que los servicios del frontend usen los mismos contratos de datos que el backend devuelve.
4. Agregar capturas de error y mensajes claros si la API retorna fallos.

## Fase 4 — Pruebas de integración local

1. Ejecutar backend en desarrollo (`pnpm dev` en `backend`).
2. Ejecutar frontend en desarrollo.
3. Navegar en la UI y verificar las llamadas a las rutas nuevas.
4. Probar casos clave:
   - carga de datos de dashboard
   - estado de salud `/api/health`
   - estado de base de datos `/api/database/status`
   - inicialización `/api/database/bootstrap` si aplica
5. Registrar cualquier error de CORS o rutas no encontradas.

## Fase 5 — Ajustes y estabilización

1. Corregir los endpoints que fallen.
2. Ajustar los adaptadores del backend si la contract del frontend no encaja exactamente.
3. Minimizar cambios en el frontend: preferir adaptaciones en la capa de servicios.
4. Añadir tests de integración ligeros si es posible.
5. Validar nuevamente el flujo completo.
------------------------------------------------------------------------ Falto----------------------------------------------
## Fase 6 — Consolidación y subida de la rama

1. Confirmar que el backend y el frontend funcionan juntos sin errores.
2. Hacer commits claros en la rama local.
3. Subir la rama a GitHub:
   - `git push origin ch/clean-architecture/database`
4. Abrir un PR o guardar la rama para revisión.

## Recomendaciones generales

- Mantén el frontend como consumidor de la API, no como lugar donde se reescribe la lógica de backend.
- Prioriza el uso de la rama local para desarrollo y pruebas antes de subir cambios.
- Documenta cualquier cambio de endpoint en el frontend y en el backend.
- Si hay discrepancias en el formato de datos, ajusta primero la capa de servicios del frontend o el adaptador del backend.

## Notas específicas para este repositorio

- El backend ya tiene wiring por inyección y rutas con `/api`.
- Usa el backend local en `http://localhost:3000/api` mientras desarrollas el frontend.
- Si el frontend corre en otra URL, revisa la configuración CORS del backend.
