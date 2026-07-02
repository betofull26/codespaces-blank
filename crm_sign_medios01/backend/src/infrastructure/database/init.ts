import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseClient } from './connection.js';

export const initializeDatabase = async () => {
  const db = await getDatabaseClient();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.resolve(__dirname, 'init.sql');
  const sql = await fs.readFile(scriptPath, 'utf8');

  await db.query(sql);
};
