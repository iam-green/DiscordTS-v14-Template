import { databaseInit } from './database';
import { discordInit } from './discord';
import 'dotenv/config';
import 'colors';

async function bootstrap() {
  await databaseInit();
  await discordInit();
}
bootstrap();
