import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
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
  const body = Object.entries(data)
    .map(([name, content]) => `${name}\n${content}`)
    .join('\n\n');

  await fs.writeFile(filePath, body, 'utf8');
  return filePath;
};

export const createBackup = async (backupType: string = 'chats'): Promise<BackupRecord> => {
  const db = await getDatabaseClient();
  const createdAt = new Date().toISOString();
  const fileName = createBackupFileName(backupType);

  const exportSet: Record<string, string> = {};
  for (const [name, config] of Object.entries(backupExportQueries)) {
    exportSet[`${name}.csv`] = await exportTableToCsv(name, config.sql);
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
