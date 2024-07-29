import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { user } from '../schema';
import {
  FindUserDto,
  CreateUserDto,
  UpdateUserDto,
  defaultFindOption,
} from '../types';

export class UserService {
  static async find(data: FindUserDto) {
    const { id, created, sort, page, count, from, to } = {
      ...defaultFindOption(),
      ...data,
    };
    return await db.query.user.findMany({
      where: and(
        id ? eq(user.id, id) : undefined,
        created ? eq(user.created, created) : between(user.created, from, to),
      ),
      orderBy: sort == 'asc' ? [asc(user.created)] : [desc(user.created)],
      offset: (page - 1) * count,
      limit: count,
    });
  }

  static async get(id: string) {
    return await db.query.user.findFirst({
      where: eq(user.id, id),
    });
  }

  static async create(data: CreateUserDto) {
    await db.insert(user).values({ ...data, created: new Date() });
    return this.get(data.id);
  }

  static async update(id: string, data: UpdateUserDto) {
    await db.update(user).set(data).where(eq(user.id, id));
    return this.get(id);
  }

  static async delete(id: string) {
    await db.delete(user).where(eq(user.id, id));
  }
}
