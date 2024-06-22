import { z } from 'zod';

export const FindOptionValidate = z
  .object({
    sort: z.enum(['asc', 'desc']).default('asc'),
    page: z
      .number()
      .or(z.string())
      .transform((v) => (typeof v == 'string' ? parseInt(v) : v))
      .optional()
      .default(1),
    count: z
      .number()
      .or(z.string())
      .transform((v) => (typeof v == 'string' ? parseInt(v) : v))
      .optional()
      .default(10),
    from: z
      .date()
      .or(z.string())
      .or(z.number())
      .transform((v) => new Date(typeof v == 'string' && isNaN(+v) ? v : +v))
      .optional()
      .default(new Date(0)),
    to: z
      .date()
      .or(z.string())
      .transform((v) => new Date(typeof v == 'string' && isNaN(+v) ? v : +v))
      .optional()
      .default(new Date(-1))
      .transform((v) => (+v == -1 ? new Date() : v)),
  })
  .refine((data) => data.from <= data.to, {
    message: 'Date of to cannot be set faster than Date of from.',
    path: ['from', 'to'],
  });

export type FindOptionDto = z.infer<typeof FindOptionValidate>;
