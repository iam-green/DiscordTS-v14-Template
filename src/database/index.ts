import { drizzle } from 'drizzle-orm/node-postgres';
import { Log } from '../module';
import { Client } from 'pg';
import * as schema from '../database/schema';

const queryClient = new Client(process.env.DATABASE_URL || '');

export const databaseInit = async (prefix: string = '') => {
  if (process.env.DATABASE_URL) {
    await queryClient.connect();
    Log.info(`${prefix ? `${prefix} ` : ''}Database Connected`);
  }
};

export const db = drizzle(queryClient, { schema });
