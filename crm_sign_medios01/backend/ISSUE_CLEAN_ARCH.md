# ISSUE: Migración a Clean Architecture — Fase 0 (Preparación)

Estado actual:
- Branch creada: `ch/clean-architecture/database` (local).
- `pnpm install` ejecutado en la raíz y en `backend`.
- Intento de ejecutar tests en `backend` falló: falta el paquete `tsx` al ejecutar `node --import tsx --test ...`.

Salida relevante:
- `pnpm install` completado con advertencias sobre scripts de build.
- `pnpm --filter backend test` no encontró proyectos desde la raíz.
- Ejecutar `pnpm test` dentro de `backend` produjo:
  - Error: Cannot find package 'tsx' imported from backend (ERR_MODULE_NOT_FOUND).

Posible causa:
- Dependencias dev (`tsx`) no están disponibles en el `node` resolver desde la ubicación de ejecución. Puede deberse a que la instalación de workspace no colocó `node_modules` locales en `backend` o a la resolución de pnpm en el entorno.

Próximos pasos recomendados:
1. Ejecutar `pnpm -w install` en la raíz del monorepo para asegurar instalación de workspace centralizada.
2. Si persiste el error, ejecutar `pnpm install` dentro de `backend` para instalar las dependencias locales.
3. Alternativamente, ejecutar tests vía pnpm workspace: `pnpm -w --filter crm-sign-medios-backend test`.
4. Una vez corregido, re-ejecutar `pnpm --filter backend test` o `pnpm test` en `backend` hasta que los tests pasen.

Notas:
- No se realizaron cambios en el código (solo creación de branch y verificación).
- Siguiente tarea sugerida: abordar la resolución de dependencias para permitir que los tests pasen y luego proceder a Fase 1.

Creado automáticamente por el script de preparación.
