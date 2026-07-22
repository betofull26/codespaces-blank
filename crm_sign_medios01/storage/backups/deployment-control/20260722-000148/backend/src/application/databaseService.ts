import { getDatabaseStatus } from '../infrastructure/database/connection.js';

export const getDatabaseHealth = async () => getDatabaseStatus();
