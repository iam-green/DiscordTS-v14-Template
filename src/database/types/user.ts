import { eq } from 'drizzle-orm';
import { user } from '../../database/schema';
import { db } from '..';
import { z } from 'zod';
import { FindOptionValidate } from './find-option';

export type User = typeof user.$inferSelect;
export const UserValidate = z.object({
  id: z
    .string()
    .refine(
      async (v) => !(await db.query.user.findFirst({ where: eq(user.id, v) })),
      { message: 'User ID is already exist.' },
    ),
  created: z.date().default(() => new Date()),
});
export const CreateUserValidate = UserValidate.omit({ created: true });
export const UpdateUserValidate = CreateUserValidate.omit({
  id: true,
}).partial();
export const FindUserValidate = UserValidate.omit({})
  .partial()
  .and(FindOptionValidate);

export type UserDto = z.infer<typeof UserValidate>;
export type CreateUserDto = z.infer<typeof CreateUserValidate>;
export type UpdateUserDto = z.infer<typeof UpdateUserValidate>;
export type FindUserDto = z.infer<typeof FindUserValidate>;
