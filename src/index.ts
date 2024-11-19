import 'dotenv/config';
import { discordInit } from './loader';

async function bootstrap() {
  await discordInit();
}
bootstrap();
