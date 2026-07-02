import { config } from './common/config.js';
import { makePgDatabaseRepository } from './infrastructure/database/connection.js';
import { makePgConversationRepository } from './infrastructure/database/conversationRepository.js';
import { makeDatabaseService } from './application/databaseService.js';
import { makeConversationService } from './application/conversationService.js';
import { initializeDatabase } from './infrastructure/database/init.js';
import { createApp } from './app.js';

const dbRepo = makePgDatabaseRepository();
const dbService = makeDatabaseService(dbRepo);
const conversationRepo = makePgConversationRepository();
const conversationService = makeConversationService(conversationRepo);

const app = createApp(dbService, { initializeDatabase }, conversationService);

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
