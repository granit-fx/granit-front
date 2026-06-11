import { describe, expect, it, vi } from 'vitest';

import {
  listValidators,
  validateFieldServer,
  validateFieldsBatch,
} from '../api/server-validation-api';

function createMockClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
  };
}

describe('listValidators', () => {
  it('calls GET /validators and returns the list', async () => {
    const client = createMockClient();
    const validators = ['Validation:Format:Iban', 'Validation:InvalidBce'];
    client.get.mockResolvedValue({ data: validators });

    const result = await listValidators(client as never);

    expect(client.get).toHaveBeenCalledWith('/api/v1/validation/validators');
    expect(result).toEqual(validators);
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    client.get.mockResolvedValue({ data: [] });

    await listValidators(client as never, '/custom');

    expect(client.get).toHaveBeenCalledWith('/custom/validators');
  });
});

describe('validateFieldServer', () => {
  it('calls POST /validate and returns the status', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({
      data: { errorCode: 'Validation:Format:Iban', status: 'Valid' },
    });

    const result = await validateFieldServer(
      client as never,
      'Validation:Format:Iban',
      'BE68539007547034',
      '/api/v1/validation'
    );

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate',
      { errorCode: 'Validation:Format:Iban', value: 'BE68539007547034' },
      { signal: undefined }
    );
    expect(result).toBe('Valid');
  });

  it('returns Invalid for invalid values', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({
      data: { errorCode: 'Validation:Format:Iban', status: 'Invalid' },
    });

    const result = await validateFieldServer(
      client as never,
      'Validation:Format:Iban',
      'INVALID',
      '/api/v1/validation'
    );

    expect(result).toBe('Invalid');
  });

  it('accepts null value for nullable fields', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({ data: { errorCode: 'test', status: 'Valid' } });

    await validateFieldServer(client as never, 'test', null, '/api/v1/validation');

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate',
      { errorCode: 'test', value: null },
      { signal: undefined }
    );
  });

  it('passes signal for abort support', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({
      data: { errorCode: 'test', status: 'Valid' },
    });
    const controller = new AbortController();

    await validateFieldServer(
      client as never,
      'test',
      'value',
      '/api/v1/validation',
      controller.signal
    );

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate',
      { errorCode: 'test', value: 'value' },
      { signal: controller.signal }
    );
  });

  it('uses custom basePath (second parameter)', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({ data: { errorCode: 'test', status: 'Valid' } });

    await validateFieldServer(client as never, 'test', 'value', '/custom');

    expect(client.post).toHaveBeenCalledWith(
      '/custom/validate',
      expect.anything(),
      expect.anything()
    );
  });

  it('uses default basePath when omitted', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({ data: { errorCode: 'test', status: 'Valid' } });

    await validateFieldServer(client as never, 'test', 'value');

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate',
      expect.anything(),
      expect.anything()
    );
  });
});

describe('validateFieldsBatch', () => {
  it('calls POST /validate-batch and returns results', async () => {
    const client = createMockClient();
    const results = [
      { errorCode: 'Validation:Format:Iban', status: 'Valid' as const },
      { errorCode: 'Validation:InvalidBce', status: 'Invalid' as const },
    ];
    client.post.mockResolvedValue({ data: { results } });

    const fields = [
      { errorCode: 'Validation:Format:Iban', value: 'BE68539007547034' },
      { errorCode: 'Validation:InvalidBce', value: '0000000000' },
    ];
    const result = await validateFieldsBatch(client as never, fields, '/api/v1/validation');

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate-batch',
      { fields },
      { signal: undefined }
    );
    expect(result).toEqual(results);
  });

  it('passes signal for abort support', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({ data: { results: [] } });
    const controller = new AbortController();

    await validateFieldsBatch(client as never, [], '/api/v1/validation', controller.signal);

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate-batch',
      expect.anything(),
      { signal: controller.signal }
    );
  });

  it('uses default basePath when omitted', async () => {
    const client = createMockClient();
    client.post.mockResolvedValue({ data: { results: [] } });

    await validateFieldsBatch(client as never, []);

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/validation/validate-batch',
      expect.anything(),
      expect.anything()
    );
  });
});
