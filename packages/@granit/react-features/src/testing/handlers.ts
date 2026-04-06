import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockFeatureGroups, mockFeatureValues } from './data.js';

import type { FeatureValueResponse } from '@granit/features';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Create stateful MSW handlers for feature flag endpoints.
 * The `featureValues` array is a mutable copy — override/delete calls
 * update state that subsequent GET calls reflect.
 *
 * @param baseUrl - API base path (default: `/api/v1/granit/features`)
 */
export function createFeaturesHandlers(baseUrl = '/api/v1/granit/features') {
  const featureValues: Mutable<FeatureValueResponse>[] = structuredClone(
    mockFeatureValues
  ) as Mutable<FeatureValueResponse>[];

  return [
    // GET definitions — returns groups with nested feature definitions
    http.get(`${baseUrl}/definitions`, () => {
      return HttpResponse.json(mockFeatureGroups);
    }),

    // GET all values
    http.get(`${baseUrl}/values`, () => {
      return HttpResponse.json(featureValues);
    }),

    // GET single value by name
    http.get(`${baseUrl}/values/:name`, ({ params }) => {
      const name = decodeURIComponent(params.name as string);
      const value = featureValues.find((v) => v.name === name);
      if (!value) return notFound();
      return HttpResponse.json(value);
    }),

    // POST override
    http.post(`${baseUrl}/overrides/:name`, async ({ params, request }) => {
      const name = decodeURIComponent(params.name as string);
      const body = (await request.json()) as { value: string };
      const existing = featureValues.find((v) => v.name === name);
      if (existing) {
        existing.value = body.value;
        return HttpResponse.json(existing);
      }
      const created: Mutable<FeatureValueResponse> = { name, value: body.value };
      featureValues.push(created);
      return HttpResponse.json(created);
    }),

    // DELETE override — reset value to definition default
    http.delete(`${baseUrl}/overrides/:name`, ({ params }) => {
      const name = decodeURIComponent(params.name as string);
      const existing = featureValues.find((v) => v.name === name);
      if (!existing) return notFound();
      const definition = mockFeatureGroups.flatMap((g) => g.features).find((f) => f.name === name);
      existing.value = definition?.defaultValue ?? existing.value;
      return noContent();
    }),
  ];
}
