import { z } from 'zod';

export const createLegalDocumentSchema = z.object({
  documentId: z
    .string()
    .min(1, 'Document ID is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase slug (e.g. privacy-policy)'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  templateName: z.string().optional(),
});

export type CreateLegalDocumentFormValues = z.infer<typeof createLegalDocumentSchema>;

export const editLegalDocumentSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  templateName: z.string().optional(),
  documentBlobId: z.string().optional(),
  concurrencyStamp: z.string(),
});

export type EditLegalDocumentFormValues = z.infer<typeof editLegalDocumentSchema>;
