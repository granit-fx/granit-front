import { z } from 'zod';

export const templateFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit faire au moins 3 caractères')
    .regex(
      /^[A-Z][a-zA-Z0-9]*(\.[A-Z][a-zA-Z0-9]*)+$/,
      'Format: Domain.Name (ex: Billing.Invoice)'
    ),
  culture: z.string().nullable().optional(),
  layoutName: z.string().nullable().optional(),
  content: z.string().min(1, 'Le contenu est requis'),
  mimeType: z.string(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
