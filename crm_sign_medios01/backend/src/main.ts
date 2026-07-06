import { config } from './common/config.js';
import { createApp } from './interface/app.js';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import selfsigned from 'selfsigned';
import { initRealtime } from './infrastructure/realtime/socket.js';
import { initializeDatabase } from './infrastructure/database/init.js';

const startServer = async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }

  const app = createApp();

  const useTls = process.env.DEV_TLS === 'true';
  let server: http.Server | https.Server;

  if (useTls) {
    let key: string | Buffer;
    let cert: string | Buffer;

    const certPath = process.env.DEV_TLS_CERT_PATH ?? '';
    const keyPath = process.env.DEV_TLS_KEY_PATH ?? '';

    if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      cert = fs.readFileSync(path.resolve(certPath));
      key = fs.readFileSync(path.resolve(keyPath));
      console.log('Using provided TLS certificate and key');
    } else {
      console.log('Generating self-signed TLS certificate for development');
      const attrs = [{ name: 'commonName', value: 'localhost' }];
      const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
      cert = pems.cert;
      key = pems.private;
    }

    server = https.createServer({ key, cert }, app);
  } else {
    server = http.createServer(app);
  }

  // initialize realtime socket.io
  try {
    initRealtime(server);
    console.log('Realtime socket initialized');
  } catch (e) {
    console.error('Failed to init realtime:', e);
  }

  server.listen(config.port, () => {
    console.log(`Backend running on port ${config.port} (tls=${useTls})`);
  });
};

void startServer();
