import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import {
  Guild,
  GuildDto,
  GuildValidate,
  FindOptionDto,
  FindOptionValidate,
} from '../types';
import { guild } from '../schema';

export class GuildService {
  static async find(data: Partial<Guild>, option?: Partial<FindOptionDto>) {
    const { id } = data;
    const { sort, page, count, from, to } = FindOptionValidate.parse(option);
    return await db.query.guild.findMany({
      where: and(
        id ? eq(guild.id, id) : undefined,
        between(guild.created, from, to),
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

  static async create(data: GuildDto) {
    await db.insert(guild).values({
      ...(await GuildValidate.parseAsync(data)),
      created: new Date(),
    });
    return this.get(data.id);
  }

  static async update(id: string, data: Partial<Guild>) {
    await db
      .update(guild)
      .set(GuildValidate.omit({ id: true }).partial().parse(data))
      .where(eq(guild.id, id));
    return this.get(id);
  }

  static async delete(id: string) {
    await db.delete(guild).where(eq(guild.id, id));
  }
}
