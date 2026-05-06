import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getFormCustomization, putFormCustomization } from '../api/form-customization-api.js';

import type {
  FormCustomizationRequest,
  FormCustomizationResponse,
} from '../types/customization.js';

const apiBase = '/api/v1';

const sampleResponse: FormCustomizationResponse = {
  entityName: 'Quote',
  variant: 'Edit',
  deltas: [
    { kind: 'Hide', fieldName: 'internalNotes' },
    { kind: 'Reorder', fieldName: 'amount', afterFieldName: 'currency' },
  ],
  updatedAt: '2026-05-06T10:00:00Z',
  updatedByUserId: 'user-1',
};

describe('getFormCustomization', () => {
  it('GETs /entities/{name}/customization/forms/{variant}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    const result = await getFormCustomization(client, apiBase, 'Quote', 'Edit');

    expect(client.get).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/forms/Edit');
    expect(result).toEqual(sampleResponse);
  });

  it('URI-encodes the entity name and variant', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    await getFormCustomization(client, apiBase, 'Custom/Entity', 'Read');

    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/entities/Custom%2FEntity/customization/forms/Read'
    );
  });

  it('propagates 403 when the caller lacks Forms.Read', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(getFormCustomization(client, apiBase, 'Quote', 'Edit')).rejects.toThrow(/403/);
  });
});

describe('putFormCustomization', () => {
  it('PUTs the deltas body to /entities/{name}/customization/forms/{variant}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleResponse));
    const request: FormCustomizationRequest = {
      deltas: [
        { kind: 'Regroup', fieldName: 'amount', groupKey: 'pricing' },
        { kind: 'Hide', fieldName: 'internalNotes' },
      ],
    };

    const result = await putFormCustomization(client, apiBase, 'Quote', 'Edit', request);

    expect(client.put).toHaveBeenCalledWith(
      '/api/v1/entities/Quote/customization/forms/Edit',
      request
    );
    expect(result).toEqual(sampleResponse);
  });

  it('propagates 422 on unknown delta kinds rejected by the backend', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Request failed with status code 422'));

    await expect(
      putFormCustomization(client, apiBase, 'Quote', 'Edit', { deltas: [] })
    ).rejects.toThrow(/422/);
  });
});
