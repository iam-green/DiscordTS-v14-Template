import 'dotenv/config';
import { databaseInit } from './database';

async function bootstrap() {
  await databaseInit(true);
  // Input Code Here
}
bootstrap();
