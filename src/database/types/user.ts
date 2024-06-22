import { eq } from 'drizzle-orm';
import { user } from '../../database/schema';
import { db } from '..';
import { z } from 'zod';

export type User = typeof user.$inferSelect;
export const UserValidate = z.object({
  id: z
    .string()
    .refine(
      async (v) => !(await db.query.user.findFirst({ where: eq(user.id, v) })),
      { message: 'User ID is already exist.' },
    ),
});
export type UserDto = z.infer<typeof UserValidate>;
