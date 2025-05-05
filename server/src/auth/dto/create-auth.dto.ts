import { z } from 'zod';

export const CreateAuthDtoSchema = z
  .object({
    email: z.string().email(),
    username: z.string(),
    password: z.string(),
  })
  .required();

export type CreateAuthDto = z.infer<typeof CreateAuthDtoSchema>;
