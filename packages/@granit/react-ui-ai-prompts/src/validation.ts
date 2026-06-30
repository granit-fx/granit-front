import { aiPromptsConstraints, ICON_COLOR_PATTERN } from '@granit/ai-prompts';
import { createConstraintsResolver } from '@granit/react-validation';

import type { useTranslation } from '@granit/react-localization';
import type { Resolver } from 'react-hook-form';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

/**
 * Prompt create/edit form values. Create and update share the same wire shape
 * (`CreatePromptRequest` ≡ `UpdatePromptRequest`), so one value type covers both
 * modes. `categoryIds` is carried unchanged from the edited prompt and never
 * surfaced as an editable field.
 */
export interface PromptFormValues {
  name: string;
  shortDescription: string;
  content: string;
  icon: string | null;
  iconColor: string | null;
}

// Builtin validation message code — mirrors @granit/validation's
// VALIDATION_ERROR_CODES so the augmentation message renders through the same
// `Validation:Builtin:*` string the spec resolver emits. Held as a local
// constant to avoid a direct dependency on @granit/validation.
const CODE_REGEX = 'Validation:Builtin:RegularExpression';

type ResolverErrors = Record<string, { type: string; message: string }>;

/**
 * Resolver for both prompt forms: spec-driven via `createConstraintsResolver`
 * over the ai-prompts contract (`required` + `maxLength` on name/content, the
 * shorter limits on shortDescription/icon), then augmented with the one
 * client-only rule the contract expresses only as an opaque server validator:
 *
 *  - iconColor : the contract carries `x-granit-validator:
 *    Validation:Format:ColorHex` (no machine-checkable regex), so the hex
 *    `#RRGGBB` / `#RRGGBBAA` shape is enforced here from `ICON_COLOR_PATTERN`
 *    (the same pattern the backend validator mirrors). A blank colour passes.
 */
export function createPromptResolver(
  mode: 'create' | 'edit',
  t: TranslateFn
): Resolver<PromptFormValues> {
  const label = (field: string): string => {
    switch (field) {
      case 'name':
        return t('AiPrompts.Form.Name');
      case 'content':
        return t('AiPrompts.Form.Content');
      case 'shortDescription':
        return t('AiPrompts.Form.ShortDescription');
      case 'iconColor':
        return t('AiPrompts.IconPicker.ColorLabel');
      default:
        return field;
    }
  };

  const baseResolver = createConstraintsResolver(
    mode === 'create'
      ? aiPromptsConstraints.CreatePromptRequest
      : aiPromptsConstraints.UpdatePromptRequest,
    t,
    { labelResolver: label }
  );

  return (async (values: Record<string, unknown>, context: unknown, options: unknown) => {
    const result = await baseResolver(
      values,
      context,
      options as Parameters<typeof baseResolver>[2]
    );
    const errors = result.errors as ResolverErrors;

    const iconColor = values.iconColor;
    if (
      !errors.iconColor &&
      typeof iconColor === 'string' &&
      iconColor !== '' &&
      !ICON_COLOR_PATTERN.test(iconColor)
    ) {
      errors.iconColor = {
        type: CODE_REGEX,
        message: t('AiPrompts.IconPicker.ColorInvalid'),
      };
    }

    return result;
  }) as unknown as Resolver<PromptFormValues>;
}
