import { z } from 'zod';

export const CreateWebhookSchema = z.object({
  url: z.string().url('Must be a valid HTTPS URL').refine(
    (u) => u.startsWith('https://') || u.startsWith('http://'),
    'URL must start with http:// or https://',
  ),
});

export type CreateWebhookDto = z.infer<typeof CreateWebhookSchema>;
