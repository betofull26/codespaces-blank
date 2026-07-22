export interface TableStatus {
  name: string;
  exists: boolean;
}

export interface DatabaseStatus {
  connected: boolean;
  message: string;
  tables: TableStatus[];
}

export const buildTableStatusRows = (
  requiredTables: string[],
  existingTables: string[],
): TableStatus[] => {
  const normalized = new Set(existingTables.map((table) => table.toLowerCase()));

  return requiredTables.map((table) => ({
    name: table,
    exists: normalized.has(table.toLowerCase()),
  }));
};
