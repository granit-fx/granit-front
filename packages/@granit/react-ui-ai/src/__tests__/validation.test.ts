import { describe, expect, it } from 'vitest';

import { createWorkspaceResolver } from '../validation';

// Identity t() — returns the key so assertions can match on error `type` (the
// builtin code) without depending on host-registered message strings.
const t = ((key: string) => key) as unknown as Parameters<typeof createWorkspaceResolver>[1];

type Fields = Record<string, { name: string }>;

// Build the react-hook-form `fields` map the resolver iterates. Only listed
// fields are validated, matching how RHF reports its registered fields.
function fieldsFor(values: Record<string, unknown>): Fields {
  return Object.fromEntries(Object.keys(values).map((name) => [name, { name }]));
}

async function run(mode: 'create' | 'edit', values: Record<string, unknown>) {
  const resolver = createWorkspaceResolver(mode, t);

  return (resolver as any)(values, undefined, { fields: fieldsFor(values) }) as Promise<{
    errors: Record<string, { type: string; message: string }>;
  }>;
}

describe('createWorkspaceResolver (create)', () => {
  const validData = {
    key: 'my-workspace',
    provider: 'openai',
    model: 'gpt-4o',
  };

  it('accepts valid minimal data', async () => {
    const { errors } = await run('create', validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('accepts all optional fields', async () => {
    const { errors } = await run('create', {
      ...validData,
      systemPrompt: 'You are a helpful assistant.',
      temperature: '0.7',
      maxOutputTokens: '2048',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('rejects an empty key', async () => {
    const { errors } = await run('create', { ...validData, key: '' });
    expect(errors.key).toBeDefined();
  });

  it('rejects a key with uppercase letters', async () => {
    const { errors } = await run('create', { ...validData, key: 'My-Workspace' });
    expect(errors.key?.message).toBe('AI.Workspaces.Validation.NameFormat');
  });

  it('rejects a key starting with a hyphen', async () => {
    const { errors } = await run('create', { ...validData, key: '-workspace' });
    expect(errors.key).toBeDefined();
  });

  it('rejects a key exceeding 128 characters', async () => {
    const { errors } = await run('create', { ...validData, key: 'a'.repeat(129) });
    expect(errors.key).toBeDefined();
  });

  it('accepts a key with numbers and hyphens', async () => {
    const { errors } = await run('create', { ...validData, key: 'my-workspace-42' });
    expect(errors.key).toBeUndefined();
  });

  it('rejects an empty provider', async () => {
    const { errors } = await run('create', { ...validData, provider: '' });
    expect(errors.provider).toBeDefined();
  });

  it('rejects an empty model', async () => {
    const { errors } = await run('create', { ...validData, model: '' });
    expect(errors.model).toBeDefined();
  });

  it('rejects temperature below 0', async () => {
    const { errors } = await run('create', { ...validData, temperature: '-0.1' });
    expect(errors.temperature).toBeDefined();
  });

  it('rejects temperature above 2', async () => {
    const { errors } = await run('create', { ...validData, temperature: '2.1' });
    expect(errors.temperature).toBeDefined();
  });

  it('accepts temperature of 0', async () => {
    const { errors } = await run('create', { ...validData, temperature: '0' });
    expect(errors.temperature).toBeUndefined();
  });

  it('accepts temperature of 2', async () => {
    const { errors } = await run('create', { ...validData, temperature: '2' });
    expect(errors.temperature).toBeUndefined();
  });

  it('rejects maxOutputTokens of 0', async () => {
    const { errors } = await run('create', { ...validData, maxOutputTokens: '0' });
    expect(errors.maxOutputTokens).toBeDefined();
  });

  it('accepts maxOutputTokens of 1', async () => {
    const { errors } = await run('create', { ...validData, maxOutputTokens: '1' });
    expect(errors.maxOutputTokens).toBeUndefined();
  });

  it('rejects a non-integer maxOutputTokens', async () => {
    const { errors } = await run('create', { ...validData, maxOutputTokens: '1.5' });
    expect(errors.maxOutputTokens).toBeDefined();
  });

  it('accepts empty string for optional fields', async () => {
    const { errors } = await run('create', {
      ...validData,
      systemPrompt: '',
      temperature: '',
      maxOutputTokens: '',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('createWorkspaceResolver (edit)', () => {
  const validData = {
    provider: 'openai',
    model: 'gpt-4o',
    activated: true,
  };

  it('accepts valid data', async () => {
    const { errors } = await run('edit', validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('rejects an empty provider', async () => {
    const { errors } = await run('edit', { ...validData, provider: '' });
    expect(errors.provider).toBeDefined();
  });

  it('accepts all optional fields', async () => {
    const { errors } = await run('edit', {
      ...validData,
      systemPrompt: 'You are a helpful assistant.',
      temperature: '1.0',
      maxOutputTokens: '4096',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
