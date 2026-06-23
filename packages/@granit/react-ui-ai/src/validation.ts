import { aiConstraints, AI_WORKSPACE_LIMITS } from '@granit/ai';
import { createConstraintsResolver } from '@granit/react-validation';

import type { useTranslation } from '@granit/react-localization';
import type { Resolver } from 'react-hook-form';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

/**
 * Create-workspace form values. Hand-written to mirror the inputs of the
 * `AIWorkspaceCreateRequest` contract — `temperature`/`maxOutputTokens` are bound
 * to text/number inputs so they carry `string` (incl. `''`) until coerced with
 * `Number(...)` at submit, hence the `number | string` union.
 */
export interface CreateWorkspaceFormValues {
  /** Workspace machine key (slug) — the API's `key` field. */
  key: string;
  provider: string;
  model: string;
  displayName?: string;
  systemPrompt?: string;
  temperature?: number | string;
  maxOutputTokens?: number | string;
}

/** Edit-workspace form values. Mirrors `AIWorkspaceUpdateRequest` (no `key`, adds `activated`). */
export interface EditWorkspaceFormValues {
  provider: string;
  model: string;
  displayName?: string;
  systemPrompt?: string;
  temperature?: number | string;
  maxOutputTokens?: number | string;
  activated: boolean;
}

export type WorkspaceFormValues = CreateWorkspaceFormValues | EditWorkspaceFormValues;

// Builtin validation message codes — mirror @granit/validation's
// VALIDATION_ERROR_CODES so the augmentation messages below render through the
// same `Validation:Builtin:*` strings (and params) the spec resolver emits. Held
// as local constants to avoid a direct dependency on @granit/validation.
const CODE_MAX_LENGTH = 'Validation:Builtin:MaximumLength';
const CODE_GTE = 'Validation:Builtin:GreaterThanOrEqual';
const CODE_LTE = 'Validation:Builtin:LessThanOrEqual';

const DISPLAY_NAME_MAX = AI_WORKSPACE_LIMITS.DISPLAY_NAME_MAX_LENGTH;
const SYSTEM_PROMPT_MAX = 32000;
const PROVIDER_MAX = 64;
const MODEL_MAX = 128;
const TEMPERATURE_MIN = 0;
const TEMPERATURE_MAX = 2;
const MAX_OUTPUT_TOKENS_MIN = 1;

type ResolverField = { readonly name: string };
type ResolverOptions = { readonly fields: Record<string, ResolverField> };
type ResolverErrors = Record<string, { type: string; message: string }>;

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * Apply the client-only validation rules the AI contract does not express.
 * Mutates `errors` in place, only filling fields the spec resolver left untouched
 * (so a spec error always wins). Shared by the create and edit resolvers.
 *
 * Each rule was carried by the previous zod schema but is absent from
 * `aiConstraints` (which holds only `required` on key/provider/model, plus the
 * key slug pattern/maxLength and number-format patterns):
 *  - displayName  : maxLength DISPLAY_NAME_MAX_LENGTH (spec: no constraint)
 *  - systemPrompt : maxLength 32000                   (spec: no constraint)
 *  - provider     : maxLength 64                      (spec: required only)
 *  - model        : maxLength 128                     (spec: required only)
 *  - temperature  : numeric range 0..2                (spec: float pattern only)
 *  - maxOutputTokens: integer >= 1                    (spec: int32 format only)
 */
function applyClientRules(
  values: Record<string, unknown>,
  errors: ResolverErrors,
  t: TranslateFn,
  label: (field: string) => string
) {
  const maxLengthMessage = (max: number, field: string) =>
    t(CODE_MAX_LENGTH, { maxLength: max, PropertyName: label(field), nsSeparator: false });

  if (
    !errors.displayName &&
    typeof values.displayName === 'string' &&
    values.displayName.length > DISPLAY_NAME_MAX
  ) {
    errors.displayName = {
      type: CODE_MAX_LENGTH,
      message: maxLengthMessage(DISPLAY_NAME_MAX, 'displayName'),
    };
  }

  if (
    !errors.systemPrompt &&
    typeof values.systemPrompt === 'string' &&
    values.systemPrompt.length > SYSTEM_PROMPT_MAX
  ) {
    errors.systemPrompt = {
      type: CODE_MAX_LENGTH,
      message: maxLengthMessage(SYSTEM_PROMPT_MAX, 'systemPrompt'),
    };
  }

  if (
    !errors.provider &&
    typeof values.provider === 'string' &&
    values.provider.length > PROVIDER_MAX
  ) {
    errors.provider = {
      type: CODE_MAX_LENGTH,
      message: maxLengthMessage(PROVIDER_MAX, 'provider'),
    };
  }

  if (!errors.model && typeof values.model === 'string' && values.model.length > MODEL_MAX) {
    errors.model = { type: CODE_MAX_LENGTH, message: maxLengthMessage(MODEL_MAX, 'model') };
  }

  if (!errors.temperature && !isBlank(values.temperature)) {
    const temperature = Number(values.temperature);
    if (Number.isNaN(temperature) || temperature < TEMPERATURE_MIN) {
      errors.temperature = {
        type: CODE_GTE,
        message: t(CODE_GTE, {
          comparisonValue: TEMPERATURE_MIN,
          PropertyName: label('temperature'),
          nsSeparator: false,
        }),
      };
    } else if (temperature > TEMPERATURE_MAX) {
      errors.temperature = {
        type: CODE_LTE,
        message: t(CODE_LTE, {
          comparisonValue: TEMPERATURE_MAX,
          PropertyName: label('temperature'),
          nsSeparator: false,
        }),
      };
    }
  }

  if (!errors.maxOutputTokens && !isBlank(values.maxOutputTokens)) {
    const maxOutputTokens = Number(values.maxOutputTokens);
    if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < MAX_OUTPUT_TOKENS_MIN) {
      errors.maxOutputTokens = {
        type: CODE_GTE,
        message: t(CODE_GTE, {
          comparisonValue: MAX_OUTPUT_TOKENS_MIN,
          PropertyName: label('maxOutputTokens'),
          nsSeparator: false,
        }),
      };
    }
  }
}

/**
 * Resolver for both workspace forms: spec-driven via `createConstraintsResolver`
 * over the AI contract, then augmented with the client-only rules above. `key`'s
 * slug pattern IS in the spec, so its pattern error is re-messaged to the existing
 * `AI.Workspaces.Validation.NameFormat` string to preserve the prior UX.
 */
export function createWorkspaceResolver(
  mode: 'create' | 'edit',
  t: TranslateFn
): Resolver<WorkspaceFormValues> {
  const label = (field: string): string => {
    switch (field) {
      case 'key':
        return t('AI.Workspaces.Form.Key');
      case 'provider':
        return t('AI.Workspaces.Form.ProviderName');
      case 'model':
        return t('AI.Workspaces.Form.Model');
      case 'displayName':
        return t('AI.Workspaces.Form.ModelName');
      case 'systemPrompt':
        return t('AI.Workspaces.Form.SystemPrompt');
      case 'temperature':
        return t('AI.Workspaces.Form.Temperature');
      case 'maxOutputTokens':
        return t('AI.Workspaces.Form.MaxOutputTokens');
      default:
        return field;
    }
  };

  const baseResolver = createConstraintsResolver(
    mode === 'create'
      ? aiConstraints.AIWorkspaceCreateRequest
      : aiConstraints.AIWorkspaceUpdateRequest,
    t,
    { labelResolver: label }
  );

  return (async (values: Record<string, unknown>, context: unknown, options: ResolverOptions) => {
    const result = await baseResolver(values, context, options);
    const errors = result.errors as ResolverErrors;

    // Preserve the previous custom message for the `key` slug-pattern violation.
    if (errors.key?.type === 'Validation:Builtin:RegularExpression') {
      errors.key = { type: errors.key.type, message: t('AI.Workspaces.Validation.NameFormat') };
    }

    applyClientRules(values, errors, t, label);

    return result;
  }) as unknown as Resolver<WorkspaceFormValues>;
}
