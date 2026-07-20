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

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE contacts ALTER COLUMN agent_id DROP NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'position'
  ) THEN
    ALTER TABLE users ADD COLUMN position TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'entry_date'
  ) THEN
    ALTER TABLE users ADD COLUMN entry_date TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'foto'
  ) THEN
    ALTER TABLE users ADD COLUMN foto TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'initials'
  ) THEN
    ALTER TABLE users ADD COLUMN initials TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'online'
  ) THEN
    ALTER TABLE users ADD COLUMN online BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN contact_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'content_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN content_type TEXT NOT NULL DEFAULT 'text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'text_body'
  ) THEN
    ALTER TABLE messages ADD COLUMN text_body TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'media_file_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN media_file_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'channel'
  ) THEN
    ALTER TABLE messages ADD COLUMN channel TEXT NOT NULL DEFAULT 'dashboard';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN auth_user_id TEXT;
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
