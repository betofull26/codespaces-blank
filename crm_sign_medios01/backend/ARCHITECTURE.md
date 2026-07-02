# Arquitectura Clean del Backend

## Propósito

Este documento describe cómo se aplica la Clean Architecture en el backend del proyecto, con especial foco en el patrón de puertos y adaptadores.

## Capas principales

- `domain`: núcleo de la aplicación. Contiene entidades, tipos y puertos.
- `application`: lógica de caso de uso. Consume puertos definidos por `domain`.
- `infrastructure`: implementaciones concretas de acceso a datos, adaptadores y rutas HTTP.
- `bootstrap`: punto de ensamblaje. Crea instancias concretas y une dependencias.

## Patrón de puertos y adaptadores

### Puerto

Un puerto es una interfaz definida en `domain` que describe una dependencia externa.

Ejemplo:

```ts
// backend/src/domain/ports/DatabaseRepository.ts
import type { DatabaseStatus } from '../database.js';

export interface DatabaseRepository {
  getStatus(): Promise<DatabaseStatus>;
}
```

### Adaptador

Un adaptador implementa el puerto y traduce la infraestructura concreta a la interfaz del dominio.

Ejemplo:

```ts
// backend/src/infrastructure/database/connection.ts
import type { DatabaseRepository } from '../../domain/ports/DatabaseRepository.js';
import type { DatabaseStatus } from '../../domain/database.js';

export const makePgDatabaseRepository = (): DatabaseRepository => ({
  getStatus: () => getDatabaseStatus(),
});
```

### Aplicación de los principios

- La capa `application` no importa `infrastructure`.
- La capa `application` depende solo de `domain`.
- `main.ts` o `app.ts` realiza la inyección de dependencias.
- Las rutas HTTP se exponen como fábricas que reciben servicios.

## Estructura de módulos relevantes

- `backend/src/domain/database.ts`: tipos `DatabaseStatus` y `TableStatus`.
- `backend/src/domain/ports/DatabaseRepository.ts`: puerto para repositorio de DB.
- `backend/src/application/databaseService.ts`: fábrica de servicio de base de datos.
- `backend/src/infrastructure/database/connection.ts`: adaptador PostgreSQL.
- `backend/src/infrastructure/http/routes/databaseRoute.ts`: router con `makeDatabaseRouter()`.
- `backend/src/infrastructure/http/routes/bootstrapRoute.ts`: router con `makeBootstrapRouter()`.
- `backend/src/app.ts`: fábrica de aplicación que arma el router.
- `backend/src/main.ts`: bootstrap que crea instancias y arranca el servidor.

## Cómo añadir un nuevo puerto/adaptador

1. Definir el puerto en `domain/ports`.
2. Crear un servicio en `application` que dependa del puerto.
3. Implementar el adaptador en `infrastructure`.
4. Crear un router fábrica que reciba el servicio.
5. Inyectar la implementación y el router en `app.ts` o `main.ts`.

## Ejemplo de workflow

- nuevo caso de uso `UserRepository`:
  1. `domain/ports/UserRepository.ts`
  2. `application/userService.ts`
  3. `infrastructure/database/userConnection.ts`
  4. `infrastructure/http/routes/userRoute.ts`
  5. `app.ts` wiring

## Nota de pruebas

- Las pruebas unitarias usan mocks en el puerto.
- Las pruebas de integración ligeras pueden ejecutar `createApp(...)` con stubs.
- El backend actual ya cuenta con:
  - `src/application/databaseService.test.ts`
  - `src/infrastructure/database/connection.test.ts`
  - `src/app.test.ts`
