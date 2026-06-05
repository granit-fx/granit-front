import { noContent, notFound, unprocessableEntity } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockFeatureGroups, mockFeatureValues } from './data';

import type { FeatureDefinitionResponse } from '@granit/features';

const allDefinitions: readonly FeatureDefinitionResponse[] = mockFeatureGroups.flatMap(
  (g) => g.features
);

/**
 * Validate an override value against a feature definition's value type,
 * mirroring the backend rules (Toggle: true/false, Numeric: min/max bounds,
 * Selection: allowed values). Returns an error message, or `null` if valid.
 */
function validateValue(definition: FeatureDefinitionResponse, value: string): string | null {
  switch (definition.valueType) {
    case 'Toggle':
      return value === 'true' || value === 'false'
        ? null
        : `Value '${value}' is not a valid toggle (expected 'true' or 'false').`;
    case 'Numeric': {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        return `Value '${value}' is not a valid integer.`;
      }
      const constraint = definition.numericConstraint;
      if (constraint && (parsed < constraint.min || parsed > constraint.max)) {
        return `Value ${parsed} is out of range [${constraint.min}, ${constraint.max}].`;
      }
      return null;
    }
    case 'Selection':
      return definition.selectionValues?.includes(value)
        ? null
        : `Value '${value}' is not an allowed selection value.`;
    default:
      return null;
  }
}

/**
 * Create stateful MSW handlers for feature flag endpoints.
 * The `featureValues` dictionary is a mutable copy — override/delete calls
 * update state that subsequent GET calls reflect.
 *
 * @param baseUrl - API base path (default: `/api/v1/features`)
 */
export function createFeaturesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const featureValues: Record<string, string> = structuredClone(mockFeatureValues);

  return [
    // GET definitions — returns groups with nested feature definitions
    http.get(`${baseUrl}/definitions`, () => {
      return HttpResponse.json(mockFeatureGroups);
    }),

    // GET all values — dictionary keyed by feature name
    http.get(`${baseUrl}/values`, () => {
      return HttpResponse.json(featureValues);
    }),

    // GET single value by name
    http.get(`${baseUrl}/values/:name`, ({ params }) => {
      const name = decodeURIComponent(params.name as string);
      if (!(name in featureValues)) return notFound();
      return HttpResponse.json({ name, value: featureValues[name] });
    }),

    // PUT override — validate against the definition, then upsert state (204)
    http.put(`${baseUrl}/overrides/:name`, async ({ params, request }) => {
      const name = decodeURIComponent(params.name as string);
      const definition = allDefinitions.find((f) => f.name === name);
      if (!definition) return notFound();

      const body = (await request.json()) as { value: string };
      const error = validateValue(definition, body.value);
      if (error) return unprocessableEntity(error);

      featureValues[name] = body.value;
      return noContent();
    }),

    // DELETE override — reset value to definition default (204)
    http.delete(`${baseUrl}/overrides/:name`, ({ params }) => {
      const name = decodeURIComponent(params.name as string);
      const definition = allDefinitions.find((f) => f.name === name);
      if (!definition) return notFound();
      featureValues[name] = definition.defaultValue;
      return noContent();
    }),
  ];
}
