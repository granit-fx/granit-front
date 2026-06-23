import { describe, expect, it } from 'vitest';

import { createWorkspaceSchema, editWorkspaceSchema } from '../validation';

const t = ((key: string) => key) as unknown as Parameters<typeof createWorkspaceSchema>[0];

describe('createWorkspaceSchema', () => {
  const schema = createWorkspaceSchema(t);

  const validData = {
    key: 'my-workspace',
    provider: 'openai',
    model: 'gpt-4o',
  };

  it('accepts valid minimal data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = schema.safeParse({
      ...validData,
      systemPrompt: 'You are a helpful assistant.',
      temperature: '0.7',
      maxOutputTokens: '2048',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty key', () => {
    const result = schema.safeParse({ ...validData, key: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a key with uppercase letters', () => {
    const result = schema.safeParse({ ...validData, key: 'My-Workspace' });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((i) => i.message)).toContain(
        'AI.Workspaces.Validation.NameFormat'
      );
  });

  it('rejects a key starting with a hyphen', () => {
    const result = schema.safeParse({ ...validData, key: '-workspace' });
    expect(result.success).toBe(false);
  });

  it('rejects a key exceeding 128 characters', () => {
    const result = schema.safeParse({ ...validData, key: 'a'.repeat(129) });
    expect(result.success).toBe(false);
  });

  it('accepts a key with numbers and hyphens', () => {
    const result = schema.safeParse({ ...validData, key: 'my-workspace-42' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty provider', () => {
    const result = schema.safeParse({ ...validData, provider: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty model', () => {
    const result = schema.safeParse({ ...validData, model: '' });
    expect(result.success).toBe(false);
  });

  it('rejects temperature below 0', () => {
    const result = schema.safeParse({ ...validData, temperature: '-0.1' });
    expect(result.success).toBe(false);
  });

  it('rejects temperature above 2', () => {
    const result = schema.safeParse({ ...validData, temperature: '2.1' });
    expect(result.success).toBe(false);
  });

  it('accepts temperature of 0', () => {
    const result = schema.safeParse({ ...validData, temperature: '0' });
    expect(result.success).toBe(true);
  });

  it('accepts temperature of 2', () => {
    const result = schema.safeParse({ ...validData, temperature: '2' });
    expect(result.success).toBe(true);
  });

  it('rejects maxOutputTokens of 0', () => {
    const result = schema.safeParse({ ...validData, maxOutputTokens: '0' });
    expect(result.success).toBe(false);
  });

  it('accepts maxOutputTokens of 1', () => {
    const result = schema.safeParse({ ...validData, maxOutputTokens: '1' });
    expect(result.success).toBe(true);
  });

  it('rejects a non-integer maxOutputTokens', () => {
    const result = schema.safeParse({ ...validData, maxOutputTokens: '1.5' });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for optional fields', () => {
    const result = schema.safeParse({
      ...validData,
      systemPrompt: '',
      temperature: '',
      maxOutputTokens: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('editWorkspaceSchema', () => {
  const schema = editWorkspaceSchema(t);

  const validData = {
    provider: 'openai',
    model: 'gpt-4o',
    activated: true,
  };

  it('accepts valid data', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing activated field', () => {
    const data = { ...validData };
    delete (data as { activated?: unknown }).activated;
    const result = schema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects an empty provider', () => {
    const result = schema.safeParse({ ...validData, provider: '' });
    expect(result.success).toBe(false);
  });

  it('accepts all optional fields', () => {
    const result = schema.safeParse({
      ...validData,
      systemPrompt: 'You are a helpful assistant.',
      temperature: '1.0',
      maxOutputTokens: '4096',
    });
    expect(result.success).toBe(true);
  });
});
