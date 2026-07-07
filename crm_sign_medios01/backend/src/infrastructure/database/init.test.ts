import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import bcrypt from 'bcrypt';

test('default admin seed uses a bcrypt hash that matches the secret password', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = await fs.readFile(path.resolve(__dirname, 'init.sql'), 'utf8');

  const match = sql.match(/\('user-admin-1', 'Administrador', 'admin', '([^']+)', 'admin', 'active', TRUE/);
  assert.ok(match?.[1], 'Expected the default admin seed hash in init.sql');

  const hash = match?.[1] ?? '';
  assert.match(hash, /^\$2b\$/);
  assert.equal(await bcrypt.compare('secret', hash), true);
});
