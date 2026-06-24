import { STANDARD_FORM_COMPONENTS } from '@granit/react-entities';

import { EmailFormComponent } from './form-components/email-form-component';
import { ImageUploadFormComponent } from './form-components/image-upload-form-component';
import { LanguageFormComponent } from './form-components/language-form-component';
import { MoneyFormComponent } from './form-components/money-form-component';
import { PhoneFormComponent } from './form-components/phone-form-component';
import { TimezoneFormComponent } from './form-components/timezone-form-component';
import { UrlFormComponent } from './form-components/url-form-component';

import type { EntityComponentCatalog } from '@granit/react-entities';

/**
 * Extends {@link STANDARD_FORM_COMPONENTS} with styled inputs for the most
 * common field types. Pass to `<EntityRendererProvider components={...} />`
 * and spread app-specific entries on top:
 *
 * ```tsx
 * <EntityRendererProvider
 *   components={{
 *     form: {
 *       ...GRANIT_UI_FORM_COMPONENTS.form,
 *       'currency-code': CurrencyCodeFormComponent,
 *     },
 *   }}
 * />
 * ```
 */
export const GRANIT_UI_FORM_COMPONENTS: EntityComponentCatalog = Object.freeze({
  form: Object.freeze({
    ...STANDARD_FORM_COMPONENTS.form,
    email: EmailFormComponent,
    'image-upload': ImageUploadFormComponent,
    language: LanguageFormComponent,
    money: MoneyFormComponent,
    phone: PhoneFormComponent,
    timezone: TimezoneFormComponent,
    url: UrlFormComponent,
  }),
});
