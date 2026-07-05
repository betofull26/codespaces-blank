import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveEnvFile } from './config.js';

test('resolveEnvFile finds the project root dotenv file from the backend directory', () => {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const projectRoot = path.resolve(currentDir, '..', '..', '..');
  const backendDir = path.join(projectRoot, 'backend');

  assert.equal(resolveEnvFile(backendDir), path.join(projectRoot, '.env'));
});
