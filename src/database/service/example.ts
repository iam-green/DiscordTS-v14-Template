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
    const { id, created, sort, page, count, from, to } = {
      ...defaultFindOption(),
      ...data,
    };
    return await db.query.example.findMany({
      where: and(
        id ? eq(example.id, id) : undefined,
        created
          ? eq(example.created, created)
          : between(example.created, from, to),
      ),
      orderBy: sort == 'asc' ? [asc(example.created)] : [desc(example.created)],
      offset: (page - 1) * count,
      limit: count,
    });
  }

  static async get(id: string) {
    return await db.query.example.findFirst({
      where: eq(example.id, id),
    });
  }

  static async create(data: CreateExampleDto) {
    const id = (
      await db
        .insert(example)
        .values({ ...data, created: new Date() })
        .returning({ id: example.id })
    )[0].id;
    return this.get(id);
  }

  static async update(id: string, data: UpdateExampleDto) {
    await db.update(example).set(data).where(eq(example.id, id));
    return this.get(id);
  }

  static async delete(id: string) {
    await db.delete(example).where(eq(example.id, id));
  }
}
