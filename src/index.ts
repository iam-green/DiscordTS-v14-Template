import 'dotenv/config';
import { databaseInit } from './database';
import { discordInit } from './discord';

async function bootstrap() {
  await databaseInit();
  await discordInit();
}
bootstrap();
