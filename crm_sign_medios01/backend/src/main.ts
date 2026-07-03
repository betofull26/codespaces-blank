import { config } from './common/config.js';
import { createApp } from './interface/app.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
