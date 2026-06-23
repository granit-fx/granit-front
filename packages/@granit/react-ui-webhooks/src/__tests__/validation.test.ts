import { describe, expect, it } from 'vitest';

import { webhookDeactivationSchema, webhookSubscriptionFormSchema } from '../validation';

describe('webhookSubscriptionFormSchema', () => {
  it('accepts a valid HTTPS URL with event type', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://api.partner.com/webhooks',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty target URL', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: '',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid URL', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'not-a-url',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects HTTP URLs (requires HTTPS)', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'http://api.partner.com/webhooks',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Must use HTTPS');
    }
  });

  it('rejects localhost URLs (SSRF protection)', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://localhost:3000/hook',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Private/local URLs are not allowed');
    }
  });

  it('rejects 127.0.0.1 URLs (SSRF protection)', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://127.0.0.1:8080/hook',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects 10.x private network URLs', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://10.0.0.5/hook',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects 192.168.x private network URLs', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://192.168.1.1/hook',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects 172.16-31.x private network URLs', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://172.16.0.1/hook',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects IPv6 link-local URLs (fe80::)', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://[fe80::1]/hook',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects IPv6 unique-local URLs (fc00::/fd00::)', () => {
    for (const addr of ['[fc00::1]', '[fd12::1]']) {
      const result = webhookSubscriptionFormSchema.safeParse({
        targetUrl: `https://${addr}/hook`,
        eventType: 'patient.created',
      });

      expect(result.success).toBe(false);
    }
  });

  it('rejects cloud metadata IP (169.254.169.254)', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://169.254.169.254/latest/meta-data/',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(false);
  });

  it('rejects .local/.internal/.localhost TLDs', () => {
    for (const host of ['server.local', 'api.internal', 'app.localhost']) {
      const result = webhookSubscriptionFormSchema.safeParse({
        targetUrl: `https://${host}/hook`,
        eventType: 'patient.created',
      });

      expect(result.success).toBe(false);
    }
  });

  it('accepts valid HTTPS URL with custom port', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://api.partner.com:8443/webhooks',
      eventType: 'patient.created',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty event type', () => {
    const result = webhookSubscriptionFormSchema.safeParse({
      targetUrl: 'https://api.partner.com/webhooks',
      eventType: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('webhookDeactivationSchema', () => {
  it('accepts a valid reason', () => {
    const result = webhookDeactivationSchema.safeParse({
      reason: 'Migrating to v2 endpoint',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty reason', () => {
    const result = webhookDeactivationSchema.safeParse({
      reason: '',
    });

    expect(result.success).toBe(false);
  });
});
