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
    return await db.query.example.findMany({
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
    return await db.query.example.findFirst({
      where: eq(example.id, id),
    });
  }

  static async create(data: CreateExampleDto) {
    return (await db.insert(example).values(data).returning())[0];
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
