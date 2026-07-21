import { PostgresUserRepository } from '../database/repositories.js';
import type { UserRepository } from '../../domain/repositories.js';

let userRepositoryFactory: (() => UserRepository) | null = null;

export const setUserRepositoryFactory = (factory: () => UserRepository): void => {
  userRepositoryFactory = factory;
};

export const resetUserRepositoryFactory = (): void => {
  userRepositoryFactory = null;
};

export const getUserRepository = (): UserRepository => {
  if (userRepositoryFactory) {
    return userRepositoryFactory();
  }

  return new PostgresUserRepository();
};
