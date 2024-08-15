import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Log } from '../module';
import { Client } from 'pg';
import * as schema from '../database/schema';

const queryClient = new Client(process.env.DATABASE_URL || '');

export const databaseInit = async (log?: boolean) => {
  if (process.env.DATABASE_URL) {
    await queryClient.connect();
    await migrate(db, {
      migrationsFolder: `${__dirname.replace(/\\/g, '/')}/migration`,
    });
    if (log) Log.info('Database Connected');
  }
};

export const db = drizzle(queryClient, { schema });
