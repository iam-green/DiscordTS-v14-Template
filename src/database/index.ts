import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Log } from '../module';
import { Client } from 'pg';
import * as schema from './schema';

const queryClient = new Client(process.env.DATABASE_URL || '');

export const databaseInit = async () => {
  if (process.env.DATABASE_URL) {
    await queryClient.connect();
    await migrate(db, { migrationsFolder: `./src/database/migration` });
    Log.info('Database Connected');
  }
};

export const db = drizzle(queryClient, { schema });
