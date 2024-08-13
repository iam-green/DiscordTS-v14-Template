import 'dotenv/config';
import 'colors';
import { databaseInit } from './database';

async function bootstrap() {
  await databaseInit();
  // Input Code Here
}
bootstrap();
