import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .refine((e) => e.endsWith('@itm.edu.co'), {
      message: 'Only institutional emails (@itm.edu.co) are allowed',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
export type CreateApiKeyDto = z.infer<typeof CreateApiKeySchema>;
