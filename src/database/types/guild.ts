import { eq } from 'drizzle-orm';
import { guild } from '../../database/schema';
import { db } from '..';
import { z } from 'zod';
import { FindOptionValidate } from './find-option';

export type Guild = typeof guild.$inferSelect;
export const GuildValidate = z.object({
  id: z
    .string()
    .refine(
      async (v) =>
        !(await db.query.guild.findFirst({ where: eq(guild.id, v) })),
      { message: 'Guild ID is already exist.' },
    ),
  created: z.date().default(() => new Date()),
});
export const CreateGuildValidate = GuildValidate.omit({ created: true });
export const UpdateGuildValidate = CreateGuildValidate.omit({
  id: true,
}).partial();
export const FindGuildValidate = GuildValidate.omit({})
  .partial()
  .and(FindOptionValidate);

export type GuildDto = z.infer<typeof GuildValidate>;
export type CreateGuildDto = z.infer<typeof CreateGuildValidate>;
export type UpdateGuildDto = z.infer<typeof UpdateGuildValidate>;
export type FindGuildDto = z.infer<typeof FindGuildValidate>;
