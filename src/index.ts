import 'dotenv/config';
import { databaseInit } from './database';

async function bootstrap() {
  await databaseInit();
  // Input Code Here
}
bootstrap();
