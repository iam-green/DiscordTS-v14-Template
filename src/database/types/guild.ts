import { eq } from 'drizzle-orm';
import { guild } from '../../database/schema';
import { db } from '..';
import { z } from 'zod';

export type Guild = typeof guild.$inferSelect;
export const GuildValidate = z.object({
  id: z
    .string()
    .refine(
      async (v) =>
        !(await db.query.guild.findFirst({ where: eq(guild.id, v) })),
      { message: 'Guild ID is already exist.' },
    ),
});
export type GuildDto = z.infer<typeof GuildValidate>;
