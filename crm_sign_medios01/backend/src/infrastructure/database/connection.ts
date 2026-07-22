import { config } from '../../common/config.js';
import { buildTableStatusRows, type DatabaseStatus } from '../../domain/database.js';
import pkg from 'pg';
import { getRequiredSchema, validateRequiredSchema } from './schema.js';

const { Pool } = pkg;

export interface DatabaseClient {
  query: (text: string, params?: unknown[]) => Promise<unknown[]>;
  end: () => Promise<void>;
}

let client: DatabaseClient | null = null;

export interface GetDatabaseClientOptions {
  skipSchemaValidation?: boolean;
}

export const resetDatabaseClient = () => {
  client = null;
};

export const validateDatabaseSchema = async (db: DatabaseClient, options?: GetDatabaseClientOptions): Promise<void> => {
  if (options?.skipSchemaValidation) {
    return;
  }

  const schemaRows = (await db.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
  )) as Array<{ table_name: string }>;
  const existingTables = new Set(schemaRows.map((row) => row.table_name));
  const presentSchema: Record<string, string[]> = {};

  for (const table of getRequiredSchema()) {
    if (!existingTables.has(table.name)) {
      throw new Error(`Missing required table: ${table.name}`);
    }

    const columnsRows = (await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [table.name],
    )) as Array<{ column_name: string }>;
    presentSchema[table.name] = columnsRows.map((row) => row.column_name);
  }

  const schemaIssues = validateRequiredSchema(getRequiredSchema(), presentSchema);
  if (schemaIssues.length > 0) {
    throw new Error(`New schema validation failed: ${schemaIssues.join('; ')}`);
  }
};

export const getDatabaseClient = async (options?: GetDatabaseClientOptions): Promise<DatabaseClient> => {
  if (client) {
    return client;
  }

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const pool = new Pool({ 
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20,
  });

  // Test the connection before returning the client
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    await pool.end();
    throw error;
  }

  client = {
    query: async (text: string, params?: unknown[]) => {
      const result = await pool.query(text, params ?? []);
      return result.rows;
    },
    end: async () => {
      await pool.end();
      client = null;
    },
  };

  await validateDatabaseSchema(client, options);

  return client;
};

export const getDatabaseStatus = async (): Promise<DatabaseStatus> => {
  try {
    const db = await getDatabaseClient();
    const rows = (await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    )) as Array<{ table_name: string }>;

    const existingTables = rows.map((row) => row.table_name);
    const requiredTables = ['users', 'auth_users', 'devices', 'conversations', 'messages', 'contacts', 'user_sessions', 'audit_logs'];

    return {
      connected: true,
      message: 'Conexión a base de datos establecida',
      tables: buildTableStatusRows(requiredTables, existingTables),
    };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'No se pudo conectar a la base de datos',
      tables: [],
    };
  }
};
