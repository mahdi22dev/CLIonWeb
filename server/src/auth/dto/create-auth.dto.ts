import { z } from 'zod';

export const CreateAuthDtoSchema = z
  .object({
    username: z.string(),
    password: z.string(),
  })
  .required();

export type CreateAuthDto = z.infer<typeof CreateAuthDtoSchema>;
