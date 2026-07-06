import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import archiver from 'archiver';
import { getDatabaseClient } from '../infrastructure/database/connection.js';
import { backupExportQueries } from '../infrastructure/database/backupSql.js';

export interface BackupRecord {
  id: string;
  backupType: string;
  fileName: string;
  createdAt: string;
  status: string;
  filePath?: string | null;
  fileUrl?: string | null;
}

export interface BackupExportEntry {
  [key: string]: string | number | boolean | null | undefined;
}

const backupsDir = path.resolve(process.cwd(), '..', 'storage', 'backups');

export const createBackupFileName = (backupType: string, createdAt: Date = new Date()): string => {
  const year = createdAt.getUTCFullYear().toString();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(createdAt.getUTCDate()).padStart(2, '0');
  const hours = String(createdAt.getUTCHours()).padStart(2, '0');
  const minutes = String(createdAt.getUTCMinutes()).padStart(2, '0');
  const seconds = String(createdAt.getUTCSeconds()).padStart(2, '0');
  return `backup-${year}${month}${day}-${hours}${minutes}${seconds}-${backupType}.zip`;
};

export const buildCsvContent = (rows: BackupExportEntry[], headers: string[]): string => {
  const escape = (value: unknown): string => {
    if (value == null) {
      return '';
    }

    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','));
  }

  return `${lines.join('\n')}\n`;
};

const ensureBackupsDir = async (): Promise<void> => {
  await fs.mkdir(backupsDir, { recursive: true });
};

const exportTableToCsv = async (tableName: string, query: string): Promise<string> => {
  const db = await getDatabaseClient();
  const rows = (await db.query(query)) as BackupExportEntry[];
  const headers = Object.keys(rows[0] ?? {}).sort();
  return buildCsvContent(rows, headers);
};

const writeBackupArchive = async (fileName: string, data: Record<string, string>): Promise<string> => {
  await ensureBackupsDir();
  const filePath = path.join(backupsDir, fileName);

  const output = createWriteStream(filePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise<string>((resolve, reject) => {
    output.on('close', () => resolve(filePath));
    output.on('end', () => resolve(filePath));
    archive.on('warning', (err: Error & { code?: string }) => {
      if ((err as any).code === 'ENOENT') {
        // log warning
      } else {
        reject(err);
      }
    });
    archive.on('error', (err: Error) => reject(err));

    archive.pipe(output);

    for (const [name, content] of Object.entries(data)) {
      archive.append(content, { name });
    }

    archive.finalize();
  });
};

export const createBackup = async (backupType: string = 'chats', agentId?: string): Promise<BackupRecord> => {
  const db = await getDatabaseClient();
  const createdAt = new Date().toISOString();
  const fileName = createBackupFileName(backupType);

  const exportSet: Record<string, string> = {};
  // If an agentId is provided and backupType is 'chats', only export that agent's
  // conversations as plain text files. Otherwise, export full CSVs and include
  // per-conversation text files as before.
  if (agentId && backupType === 'chats') {
    const convRows = (await db.query(
      `SELECT id, agent_id, client_name, topic, start_time FROM conversations WHERE agent_id = $1 ORDER BY start_time`,
      [agentId],
    )) as Array<{ id: string; agent_id: string; client_name: string; topic: string; start_time: string }>;

    for (const conv of convRows) {
      const messages = (await db.query(
        'SELECT sender, text, time FROM messages WHERE conversation_id = $1 ORDER BY time',
        [conv.id],
      )) as Array<{ sender: string; text: string; time: string }>;

      const header = [`Conversation: ${conv.id}`, `Client: ${conv.client_name}`, `AgentId: ${conv.agent_id}`, `Topic: ${conv.topic}`, `Start: ${conv.start_time}`, ''];
      const lines = messages.map((m) => `[${m.time}] ${m.sender}: ${m.text}`);
      const content = `${header.join('\n')}\n${lines.join('\n')}\n`;

      const safeClient = conv.client_name ? conv.client_name.replace(/[^a-z0-9\-_. ]+/gi, '_').trim().replace(/\s+/g, '_') : 'unknown_client';
      const safeId = conv.id.replace(/[^a-z0-9\-_.]/gi, '_');
      exportSet[`conversations/${safeClient}/${safeId}.txt`] = content;
    }
  } else {
    for (const [name, config] of Object.entries(backupExportQueries)) {
      exportSet[`${name}.csv`] = await exportTableToCsv(name, config.sql);
    }

    const convRows = (await db.query(`SELECT id, agent_id, client_name, topic, start_time FROM conversations ORDER BY start_time`)) as Array<{ id: string; agent_id: string; client_name: string; topic: string; start_time: string }>;
    for (const conv of convRows) {
      const messages = (await db.query(
        'SELECT sender, text, time FROM messages WHERE conversation_id = $1 ORDER BY time',
        [conv.id],
      )) as Array<{ sender: string; text: string; time: string }>;

      const header = [`Conversation: ${conv.id}`, `Client: ${conv.client_name}`, `AgentId: ${conv.agent_id}`, `Topic: ${conv.topic}`, `Start: ${conv.start_time}`, ''];
      const lines = messages.map((m) => `[${m.time}] ${m.sender}: ${m.text}`);
      const content = `${header.join('\n')}\n${lines.join('\n')}\n`;

      const safeClient = conv.client_name ? conv.client_name.replace(/[^a-z0-9\-_. ]+/gi, '_').trim().replace(/\s+/g, '_') : 'unknown_client';
      const safeId = conv.id.replace(/[^a-z0-9\-_.]/gi, '_');
      exportSet[`conversations/${safeClient}/${safeId}.txt`] = content;
    }
  }

  const filePath = await writeBackupArchive(fileName, exportSet);
  const backupId = randomUUID();

  await db.query(
    'INSERT INTO backups (id, backup_type, file_name, created_at, status, file_path, file_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [backupId, backupType, fileName, createdAt, 'completed', filePath, `/api/backups/download/${backupId}`],
  );

  return {
    id: backupId,
    backupType,
    fileName,
    createdAt,
    status: 'completed',
    filePath,
    fileUrl: `/api/backups/download/${backupId}`,
  };
};

export const listBackups = async (): Promise<BackupRecord[]> => {
  const db = await getDatabaseClient();
  const rows = (await db.query(
    'SELECT id, backup_type AS "backupType", file_name AS "fileName", created_at AS "createdAt", status, file_path AS "filePath", file_url AS "fileUrl" FROM backups ORDER BY created_at DESC',
  )) as BackupRecord[];

  return rows;
};

export const getBackupById = async (backupId: string): Promise<BackupRecord | null> => {
  const db = await getDatabaseClient();
  const rows = (await db.query(
    'SELECT id, backup_type AS "backupType", file_name AS "fileName", created_at AS "createdAt", status, file_path AS "filePath", file_url AS "fileUrl" FROM backups WHERE id = $1',
    [backupId],
  )) as BackupRecord[];

  return rows[0] ?? null;
};

export const downloadBackupFile = async (backupId: string): Promise<{ filePath: string; fileName: string } | null> => {
  const record = await getBackupById(backupId);
  if (!record?.filePath) {
    return null;
  }

  return {
    filePath: record.filePath,
    fileName: record.fileName,
  };
};
