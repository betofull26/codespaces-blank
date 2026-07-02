# Plan de migración a Clean Architecture (mínimo viable)

Objetivo
- Asegurar que el backend sigue los principios de Clean Architecture: las capas internas (`domain`, `application`) no deben depender de las externas (`infrastructure`). Inversión de dependencias mediante puertos/contratos y adaptadores.

Resumen de cambios
1. Definir puertos/contratos en `domain`.
2. Hacer que la capa `application` dependa únicamente de esos puertos.
3. Implementar adaptadores concretos en `infrastructure` que cumplan los puertos.
4. Inyectar las implementaciones concretas desde el bootstrap (`main.ts`) hacia las fábricas de servicios y las rutas.
5. Actualizar rutas para aceptar servicios por inyección en lugar de importar servicios `application` directamente.

Archivos a crear/modificar (propuesta mínima)
- Crear: `backend/src/domain/ports/DatabaseRepository.ts` — interfaz/puerto con `getStatus(): Promise<DatabaseStatus>`.
- Modificar: `backend/src/application/databaseService.ts` — convertir en fábrica que recibe `DatabaseRepository` y expone `getDatabaseHealth()`.
- Modificar: `backend/src/infrastructure/database/connection.ts` — exportar una implementación que cumple `DatabaseRepository` (adaptador).
- Modificar: `backend/src/infrastructure/http/routes/databaseRoute.ts` — exportar `makeDatabaseRouter(databaseService)` en lugar de usar import directo.
- Modificar: `backend/src/infrastructure/http/routes/bootstrapRoute.ts` — similar a `databaseRoute`, inyectar servicio/adaptador.
- Modificar: `backend/src/main.ts` — crear instancias concretas del adaptador, construir servicios mediante las fábricas y pasar las dependencias a las rutas.

Ejemplo de interfaz (esquema)
```ts
// backend/src/domain/ports/DatabaseRepository.ts
import type { DatabaseStatus } from '../database.js';
export interface DatabaseRepository {
  getStatus(): Promise<DatabaseStatus>;
}
```

Ejemplo de fábrica en `application`
```ts
// backend/src/application/databaseService.ts
import type { DatabaseRepository } from '../domain/ports/DatabaseRepository.js';
export const makeDatabaseService = (repo: DatabaseRepository) => ({
  getDatabaseHealth: async () => repo.getStatus(),
});
```

Ejemplo de adaptador (siguiendo `DatabaseRepository`)
```ts
// backend/src/infrastructure/database/connection.ts
import { getDatabaseClient } from './connection-internal.js';
import type { DatabaseRepository } from '../../domain/ports/DatabaseRepository.js';
import type { DatabaseStatus } from '../../domain/database.js';

export const makePgDatabaseRepository = (): DatabaseRepository => ({
  getStatus: async (): Promise<DatabaseStatus> => {
    // usar getDatabaseClient() internamente y mapear a DatabaseStatus
  },
});
```

Wiring en `main.ts` (esquema)
```ts
import { makePgDatabaseRepository } from './infrastructure/database/connection.js';
import { makeDatabaseService } from './application/databaseService.js';
import { makeDatabaseRouter } from './infrastructure/http/routes/databaseRoute.js';

const dbRepo = makePgDatabaseRepository();
const databaseService = makeDatabaseService(dbRepo);
const databaseRouter = makeDatabaseRouter(databaseService);
app.use('/api', databaseRouter);
```

Checklist de implementación (pasos ordenados)
- [ ] Añadir `backend/src/domain/ports/DatabaseRepository.ts`.
- [ ] Refactorizar `backend/src/application/databaseService.ts` a fábrica dependiente del puerto.
- [ ] Implementar adaptador `makePgDatabaseRepository` en `infrastructure/database/connection.ts` (mantener `DatabaseClient` privado dentro de `infrastructure`).
- [ ] Cambiar `databaseRoute.ts` para exportar `makeDatabaseRouter(databaseService)`.
- [ ] Cambiar `bootstrapRoute.ts` para inyectar la dependencia necesaria.
- [ ] Actualizar `main.ts` para crear adaptadores, fábricas y routers, y realizar el wiring.
- [ ] Ejecutar tests y ajustar firmas si es necesario.
- [ ] Documentar en `backend/ARCHITECTURE.md` el patrón de puertos/adaptadores y ejemplos de uso.

Comandos recomendados para verificar
```bash
# desde la raíz del monorepo
pnpm install
pnpm --filter backend test
pnpm --filter backend build
```

Riesgos y notas
- Cambios localizados: este plan minimiza el área de cambio tocando únicamente la integración `database` y el wiring (routes + main). Permite validar el patrón antes de aplicarlo al resto.
- Tests: puede requerir actualizar mocks o tests que importen directamente implementaciones de infraestructura.
- Consistencia: mantener tipos `DatabaseStatus` y `TableStatus` en `domain` para que tanto puerto como adaptador usen las mismas firmas.

Siguiente paso sugerido
- Si apruebas, puedo aplicar el refactor mínimo automáticamente en los archivos listados y ejecutar los tests; o generar un parche con los cambios propuestos para que revises antes de aplicar.
    
---

Fases del proyecto (plan de trabajo por iteraciones)

Fase 0 — Preparación (duración estimada: 0.5 día)
- Objetivo: preparar entorno, asegurar que tests y lint pasan localmente, y crear ramas para trabajo.
- Tareas:
  - Crear branch `ch/clean-architecture/database` a partir de `main`.
  - Ejecutar `pnpm install` y `pnpm --filter backend test` para validar estado actual.
  - Añadir ticket/issue con alcance mínimo para la migración.
- Criterio de salida: tests de baseline ejecutados y branch creada.

Fase 1 — Definición de puertos/contratos (duración estimada: 0.5-1 día)
- Objetivo: definir contratos en `domain` que expresen las dependencias hacia infra.
- Tareas:
  - Crear `backend/src/domain/ports/DatabaseRepository.ts` con `getStatus(): Promise<DatabaseStatus>`.
  - Verificar y centralizar tipos `DatabaseStatus` y `TableStatus` en `domain`.
  - Añadir comentarios y ejemplos de uso en el archivo del puerto.
- Criterio de salida: puerto creado y tipos sincronizados; PR pequeño con solo definiciones.

Fase 2 — Refactor de la capa Application (duración estimada: 0.5 día)
- Objetivo: hacer que `application` dependa únicamente de puertos definidos en `domain`.
- Tareas:
  - Refactorizar `backend/src/application/databaseService.ts` a fábrica `makeDatabaseService(repo)`.
  - Eliminar importaciones directas a `infrastructure` desde `application`.
  - Añadir tests unitarios que usen mocks del puerto para comprobar comportamiento.
- Criterio de salida: servicios de aplicación no importan `infrastructure` y tests pasan.

Fase 3 — Implementación de adaptadores en Infrastructure 
- Objetivo: adaptar las implementaciones concretas para cumplir los puertos.
- Tareas:
  - Implementar `makePgDatabaseRepository()` en `infrastructure/database/connection.ts` o archivo complementario.
  - Mantener `DatabaseClient` y detalles de `pg` internos a `infrastructure`.
  - Añadir tests de integración ligeros (puede ser con un sqlite/pg mock) que verifiquen la adaptación de resultados a `DatabaseStatus`.
- Criterio de salida: adaptador implementado y cubierto por pruebas.

Fase 4 — Wiring e inyección en bootstrap 
- Objetivo: mover la creación de instancias concretas al bootstrap y exponer routers como fábricas.
- Tareas:
  - Convertir rutas en fábricas: `makeDatabaseRouter(databaseService)` y `makeBootstrapRouter(initializeService)`.
  - Modificar `main.ts` para crear adaptadores, servicios y routers, e inyectarlos en `app.use`.
  - Verificar que la app arranca y endpoints `/api/health`, `/api/database/status`, `/api/database/bootstrap` funcionan.
- Criterio de salida: aplicación levantada con wiring por inyección y pruebas e2e básicas pasan.

Fase 5 — Tests, documentación y limpieza (duración estimada: 0.5-1 día)
- Objetivo: asegurar cobertura, documentar decisiones y preparar PR listo para revisión.
- Tareas:
  - Ejecutar y arreglar tests unitarios y de integración.
  - Añadir `backend/ARCHITECTURE.md` con diagrama y guías de cómo añadir nuevos puertos/adaptadores.
  - Actualizar `ESTRUCTURA_Y_ARQUITECTURA.md` si procede para reflejar cambios.
  - Limpiar imports no usados y añadir ejemplos de mock para desarrolladores.
- Criterio de salida: tests pasan y documentación añadida.

Fase 6 — Despliegue y monitoreo (opcional, duración estimada: 0.5 día)
- Objetivo: desplegar cambios a staging y validar comportamiento en entorno real.
- Tareas:
  - Construir artefacto backend (`pnpm --filter backend build`) y desplegar en staging.
  - Ejecutar sanity checks y coleccionar métricas de arranque y endpoints.
- Criterio de salida: despliegue en staging validado.

Notas sobre gobernanza de cambios
- Hacer PRs pequeños por fase y revisar en code review para mantener trazabilidad.
- Mantener preservación de tipos en `domain` para evitar roturas en consumidoras.

Estimación total orientativa: 3-4 días hombre (dependiendo de tests e integración con DB real).

Próximo paso sugerido
- Confirmar si deseas que aplique la Fase 1 y 2 automáticamente (creo los archivos y PRs locales), o si prefieres revisar los cambios en forma de parche antes de aplicar.
