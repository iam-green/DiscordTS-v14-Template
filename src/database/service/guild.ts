import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import {
  FindGuildDto,
  CreateGuildDto,
  UpdateGuildDto,
  defaultFindOption,
} from '../types';
import { guild } from '../schema';

export class GuildService {
  static async find(data: FindGuildDto) {
    const { id, created, sort, page, count, from, to } = {
      ...defaultFindOption(),
      ...data,
    };
    return await db.query.guild.findMany({
      where: and(
        id ? eq(guild.id, id) : undefined,
        created ? eq(guild.created, created) : between(guild.created, from, to),
      ),
      orderBy: sort == 'asc' ? [asc(guild.created)] : [desc(guild.created)],
      offset: (page - 1) * count,
      limit: count,
    });
  }

  static async get(id: string) {
    return await db.query.guild.findFirst({
      where: eq(guild.id, id),
    });
  }

  static async create(data: CreateGuildDto) {
    await db.insert(guild).values({ ...data, created: new Date() });
    return this.get(data.id);
  }

  static async update(id: string, data: UpdateGuildDto) {
    await db.update(guild).set(data).where(eq(guild.id, id));
    return this.get(id);
  }

  static async delete(id: string) {
    await db.delete(guild).where(eq(guild.id, id));
  }
}
