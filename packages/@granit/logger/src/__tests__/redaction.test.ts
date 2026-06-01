import { describe, expect, it } from 'vitest';

import {
  emailDomain,
  hashPrefix,
  redact,
  redactEmail,
  redactIpAddress,
  redactPhone,
  redactToken,
  redactUsername,
} from '../redaction';

describe('redactEmail', () => {
  it('preserves 3-char prefix and domain', () => {
    expect(redactEmail('john.doe@example.com')).toBe('joh***@example.com');
  });

  it('masks when no @ is present', () => {
    expect(redactEmail('not-an-email')).toBe('***');
  });

  it('masks when local part is empty', () => {
    expect(redactEmail('@example.com')).toBe('***');
  });
});

describe('emailDomain', () => {
  it('returns the domain', () => {
    expect(emailDomain('a@example.com')).toBe('example.com');
  });

  it('returns "unknown" for non-emails', () => {
    expect(emailDomain('no-at-sign')).toBe('unknown');
  });
});

describe('redactPhone', () => {
  it('keeps country code and last 2 digits', () => {
    expect(redactPhone('+33612345678')).toBe('+336*****78');
  });

  it('masks short values', () => {
    expect(redactPhone('123')).toBe('***');
  });
});

describe('redactToken', () => {
  it('keeps short prefix and suffix', () => {
    expect(redactToken('dLkj3FDmAbCdEfGh')).toBe('dLkj...fGh');
  });

  it('masks values shorter than 8 chars', () => {
    expect(redactToken('short')).toBe('***');
  });
});

describe('redactIpAddress', () => {
  it('masks last IPv4 octet', () => {
    expect(redactIpAddress('192.168.1.42')).toBe('192.168.1.***');
  });

  it('truncates IPv6 after the fourth group', () => {
    expect(redactIpAddress('2001:db8:0:0:0:0:0:1')).toBe('2001:db8:0:0:***');
  });
});

describe('redactUsername', () => {
  it('keeps 3-char prefix', () => {
    expect(redactUsername('john_admin')).toBe('joh***');
  });

  it('masks short values', () => {
    expect(redactUsername('jo')).toBe('***');
  });
});

describe('hashPrefix', () => {
  it('returns an 8-char hex digest', async () => {
    const out = await hashPrefix('john.doe@example.com');
    expect(out).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic', async () => {
    expect(await hashPrefix('x')).toBe(await hashPrefix('x'));
  });
});

describe('redact aggregate', () => {
  it('exposes the call-site API', () => {
    expect(redact.email('john@example.com')).toBe('joh***@example.com');
    expect(redact.phone('+33612345678')).toBe('+336*****78');
    expect(redact.token('aaaaaaaaaa')).toBe('aaaa...aaa');
  });
});
