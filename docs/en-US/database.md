<h1 align="center">DiscordTS v14 Template Database</h1>
<p align="center">
  <a href="/docs/en-US/database.md">English</a>
  &nbsp;|&nbsp;
  <a href="/docs/ko/database.md">한국어</a>
</p>

This template is using [Drizzle ORM](https://orm.drizzle.team/) for easy database use.<br>
This template uses the [PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql) database by default.

> [!NOTE]
> If you want to save locally using a [SQLite](https://orm.drizzle.team/docs/get-started-sqlite) database, see [How to save locally](#Local-Save-How-To).<br>
> If you want to use a different database, see the [Drizzle ORM Documentation](https://orm.drizzle.team/docs/get-started).

## Table of Contents

- [Setting Configuration](#Setting-Configuration)
  - [Environment Variables](#Environment-Variables)
- [Schema](#Schema)
- [Types](#Types)
- [Services](#Services)
- [Local Save Method](#Local-Save-Method)
  - [Change Package](#Change-Package)
  - [Remove Migration Folder](#Remove-Migration-Folder)
  - [Modify Configuration Code](#Modify-Configuration-Code)
  - [Modify Main Code](#Modify-Main-Code)
  - [Modify Schema Code](#Modify-Schema-Code)

## Setting Configuration

### Environment Variables

Rename the <a style="color: gray;" href="/.env.example">.env.example</a> file to <a style="color: gray;" href="/.env">.env</a>, and then write something like this

```properties
BOT_TOKEN= # Discord Bot Token
DATABASE_URL=postgres://username:password@host:port/database
```

You can do this by writing your environment variable settings like the code above.

## Schema

```ts
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

export const example = pgTable('example', {
  id: uuid('id').primaryKey().defaultRandom(),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
});
```

<a style="color: gray;" href="/src/database/schema/example.ts">/src/database/schema/example.ts</a>

|  Field  |   Type   |  Null   |   Key   |        Default         |
| :-----: | :------: | :-----: | :-----: | :--------------------: |
|   id    | `string` | `false` | Primary |      Random UUID       |
| created |  `Date`  | `false` |         | Database Creation Time |

> [!NOTE]
> The code above is an example of schema code, and the table above is the structure of the example schema.<br>
> For more schema types in PostgreSQL, see the [Documentation](https://orm.drizzle.team/docs/column-types/pg).

## Types

```ts
import { FindOptionDto } from './find-option';

export type ExampleDto = typeof example.$inferSelect;

export type CreateExampleDto = Omit<ExampleDto, 'id' | 'created'>;

export type UpdateExampleDto = Partial<CreateExampleDto>;

export type FindExampleDto = FindOptionDto & Partial<ExampleDto>;
```

<a style="color: gray;" href="/src/database/types/example.ts">/src/database/types/example.ts</a>

> [!NOTE]
> The code above is an example of types in the example schema.<br>
> Feel free to add or remove types as you see fit.

## Services

```ts
import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import {
  CreateExampleDto,
  defaultFindOption,
  FindExampleDto,
  UpdateExampleDto,
} from '../types';
import { example } from '../schema';

export class ExampleService {
  static async find(data: FindExampleDto) {
    const { id, created, sort, page, limit, from, to } = {
      ...defaultFindOption(),
      ...data,
    };
    return db.query.example.findMany({
      where: and(
        id ? eq(example.id, id) : undefined,
        created
          ? eq(example.created, created)
          : between(example.created, from, to),
      ),
      orderBy: sort == 'asc' ? [asc(example.created)] : [desc(example.created)],
      offset: (page - 1) * limit,
      limit,
    });
  }

  static async get(id: string) {
    return db.query.example.findFirst({
      where: eq(example.id, id),
    });
  }

  static async create(data: CreateExampleDto) {
    return (
      await db.insert(example).values(data).onConflictDoNothing().returning()
    )[0];
  }

  static async update(id: string, data: UpdateExampleDto) {
    return (
      await db.update(example).set(data).where(eq(example.id, id)).returning()
    )[0];
  }

  static async delete(id: string) {
    await db.delete(example).where(eq(example.id, id));
  }
}
```

<a style="color: gray;" href="/src/database/service/example.ts">/src/database/service/example.ts</a>

> [!NOTE]
> The above code is an example of a service in the example schema.<br>
> Feel free to add or remove functions to the database as you wish.

## Local Save Method

### Change Package

You should use the [SQLite](https://orm.drizzle.team/docs/get-started-sqlite) package instead of [PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql) to store your database locally.

```bash
npm remove pg @types/pg
```

After using this command to remove the [PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql) package,

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

You can use this command to install the [SQLite](https://orm.drizzle.team/docs/get-started-sqlite) package.

### Remove Migration Folder

To apply the new schema, clear the folder `./src/database/migration` that you were using before.

### Modify Configuration Code

```diff
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

export default defineConfig({
-   dialect: 'postgresql',
+   dialect: 'sqlite',
  schema: './src/database/schema/**/*.{js,ts}',
  out: './src/database/migration',
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

<a style="color: gray;" href="/drizzle.config.ts">/drizzle.config.ts</a>

### Modify Main Code

```diff
- import { drizzle } from 'drizzle-orm/node-postgres';
- import { migrate } from 'drizzle-orm/node-postgres/migrator';
+ import { drizzle } from 'drizzle-orm/better-sqlite3';
+ import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { Log } from '../module';
- import { Client } from 'pg';
+ import Database from 'better-sqlite3';
import * as schema from './schema';

- const client = new Client(process.env.DATABASE_URL);
+ const client = new Database(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

export const databaseInit = async () => {
  if (process.env.DATABASE_URL) {
-    await client.connect();
    await migrate(db, { migrationsFolder: `./src/database/migration` });
    Log.info('Database Connected');
  }
};
```

<a style="color: gray;" href="/src/database/index.ts">/src/database/index.ts</a>

### Modify Schema Code

```diff
- import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
+ import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

- export const example = pgTable('example', {
-   id: uuid('id').primaryKey().defaultRandom(),
-   created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
+ export const example = sqliteTable('example', {
+   id: text('id').$defaultFn(() => crypto.randomUUID()),
+   created: text('created').$type<Date>().$defaultFn(() => new Date()),
});
```

<a style="color: gray;" href="/src/database/schema/example.ts">/src/database/schema/example.ts</a>

> [!NOTE]
> For more schema types in SQLite, see [Documentation](https://orm.drizzle.team/docs/column-types/sqlite).
