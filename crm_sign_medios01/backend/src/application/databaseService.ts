import type { DatabaseRepository } from '../domain/ports/DatabaseRepository.js';

/**
 * Fábrica para los servicios de base de datos en la capa de aplicación.
 * Recibe un `DatabaseRepository` (puerto) y expone operaciones de aplicación.
 */
export const makeDatabaseService = (repo: DatabaseRepository) => ({
  getDatabaseHealth: async () => repo.getStatus(),
});
