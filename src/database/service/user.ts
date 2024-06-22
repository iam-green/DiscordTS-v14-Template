import { and, asc, between, desc, eq } from 'drizzle-orm';
import { db } from '..';
import { user } from '../schema';
import {
  User,
  UserDto,
  UserValidate,
  FindOptionDto,
  FindOptionValidate,
} from '../types';

export class UserService {
  static async find(data: Partial<User>, option?: Partial<FindOptionDto>) {
    const { id } = data;
    const { sort, page, count, from, to } = FindOptionValidate.parse(option);
    return await db.query.user.findMany({
      where: and(
        id ? eq(user.id, id) : undefined,
        between(user.created, from, to),
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

  static async create(data: UserDto) {
    await db.insert(user).values({
      ...(await UserValidate.parseAsync(data)),
      created: new Date(),
    });
    return this.get(data.id);
  }

  static async update(id: string, data: Partial<User>) {
    await db
      .update(user)
      .set(UserValidate.omit({ id: true }).partial().parse(data))
      .where(eq(user.id, id));
    return this.get(id);
  }

  static async delete(id: string) {
    await db.delete(user).where(eq(user.id, id));
  }
}
