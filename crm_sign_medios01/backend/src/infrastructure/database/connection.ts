import { config } from '../../common/config.js';
import { buildTableStatusRows, type DatabaseStatus } from '../../domain/database.js';

export interface DatabaseClient {
  query: (text: string, params?: unknown[]) => Promise<unknown[]>;
  end: () => Promise<void>;
}

let client: DatabaseClient | null = null;

export const getDatabaseClient = async (): Promise<DatabaseClient> => {
  if (client) {
    return client;
  }

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: config.databaseUrl });

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

  return client;
};

export const getDatabaseStatus = async (): Promise<DatabaseStatus> => {
  try {
    const db = await getDatabaseClient();
    const rows = (await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    )) as Array<{ table_name: string }>;

    const existingTables = rows.map((row) => row.table_name);
    const requiredTables = ['agents', 'conversations', 'messages'];

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
