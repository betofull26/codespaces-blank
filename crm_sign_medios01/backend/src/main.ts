import { config } from './common/config.js';
import { createApp } from './interface/app.js';
import { initializeDatabase } from './infrastructure/database/init.js';

const startServer = async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Backend running on port ${config.port}`);
  });
};

void startServer();
