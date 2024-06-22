import 'dotenv/config';
import 'colors';
import { databaseInit } from './database';
import { discordInit } from './discord';

async function bootstrap() {
  await databaseInit();
  await discordInit();
}
bootstrap();
