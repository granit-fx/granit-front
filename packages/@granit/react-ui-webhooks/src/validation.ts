import { z } from 'zod';

import { logger } from './logger';

const PRIVATE_IPV4 =
  /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/i;
const PRIVATE_IPV6 = /^https?:\/\/\[(::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/i;

function isBlockedHost(url: string): boolean {
  return PRIVATE_IPV4.test(url) || PRIVATE_IPV6.test(url);
}

const BLOCKED_TLDS = /\.(local|internal|localhost|onion)([:/]|$)/i;

export const webhookSubscriptionFormSchema = z.object({
  targetUrl: z
    .string()
    .min(1, 'Target URL is required')
    .url('Must be a valid URL')
    .refine((url) => url.startsWith('https://'), 'Must use HTTPS')
    .refine((url) => !isBlockedHost(url), 'Private/local URLs are not allowed')
    .refine((url) => {
      try {
        return !BLOCKED_TLDS.test(new URL(url).hostname);
      } catch (err) {
        // Unparseable URL — reject it (the .url() check normally catches this first).
        logger.error('[validation] Failed to parse target URL', err);
        return false;
      }
    }, 'Private/local URLs are not allowed'),
  eventType: z.string().min(1, 'Event type is required'),
});

export type WebhookSubscriptionFormValues = z.infer<typeof webhookSubscriptionFormSchema>;

export const webhookDeactivationSchema = z.object({
  reason: z.string().min(1, 'Deactivation reason is required'),
});

export type WebhookDeactivationFormValues = z.infer<typeof webhookDeactivationSchema>;
