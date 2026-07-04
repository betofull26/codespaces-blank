import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseClient } from './connection.js';

export const getUserSchemaMigrationSql = () => `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE users DROP COLUMN IF EXISTS email;
  END IF;
END $$;
`;

export const initializeDatabase = async () => {
  const db = await getDatabaseClient();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.resolve(__dirname, 'init.sql');
  const sql = await fs.readFile(scriptPath, 'utf8');

  await db.query(getUserSchemaMigrationSql());
  await db.query(sql);
};
