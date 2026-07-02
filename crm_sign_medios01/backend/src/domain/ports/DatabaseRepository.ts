/**
 * Puerto/contrato para el acceso a la base de datos desde las capas internas.
 *
 * Este archivo define la interfaz que la capa `application` espera de la
 * infraestructura de persistencia. Las implementaciones concretas (adaptadores)
 * vivirán en `infrastructure/` y deberán cumplir esta interfaz para mantener la
 * inversión de dependencias.
 */
import type { DatabaseStatus } from '../database.js';

/**
 * Interfaz que representa el repositorio/adapter de base de datos.
 * - `getStatus` retorna el estado de la base de datos y las tablas requeridas.
 */
export interface DatabaseRepository {
  getStatus(): Promise<DatabaseStatus>;
}

/* Ejemplo de uso (para la capa `application`):

import type { DatabaseRepository } from './ports/DatabaseRepository.js';

export const makeDatabaseService = (repo: DatabaseRepository) => ({
  getDatabaseHealth: async () => repo.getStatus(),
});

*/
