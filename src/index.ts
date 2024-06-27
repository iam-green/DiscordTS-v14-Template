import 'dotenv/config';
import 'colors';
import { discordInit } from './discord';

async function bootstrap() {
  await discordInit();
}
bootstrap();
