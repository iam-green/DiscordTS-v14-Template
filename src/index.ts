import 'dotenv/config';
import { databaseInit } from './database';
import { discordInit } from './discord';

async function bootstrap() {
  await databaseInit(true);
  await discordInit();
}
bootstrap();
