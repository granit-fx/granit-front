import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  identifier: z
    .string()
    .min(1, 'Identifier is required')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Must be a lowercase slug (e.g. acme-corp)'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  jurisdiction: z.string().max(16).optional().or(z.literal('')),
});

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

export const editTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  contactEmail: z.string().email().optional().or(z.literal('')),
  jurisdiction: z.string().max(16).optional().or(z.literal('')),
});

export type EditTenantFormValues = z.infer<typeof editTenantSchema>;
