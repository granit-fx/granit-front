import type { API_KEY_ENVIRONMENTS } from './constants';
import type { ApiKeyType, CacheBehavior } from '@granit/authentication-api-keys';

// Form value shapes for the api-key forms. Validation is spec-driven: the
// create form and the scopes form derive their rules from the OpenAPI-backed
// apiKeysConstraints via createConstraintsResolver (@granit/react-validation),
// so there is no hand-written schema here — only the field shapes consumed by
// react-hook-form.

export type ApiKeyEnvironment = (typeof API_KEY_ENVIRONMENTS)[number];

export interface ApiKeyCreateFormValues {
  name: string;
  type: ApiKeyType;
  environment: ApiKeyEnvironment;
  permissions: string[];
  allowedCidrs: string[];
  expiresAt?: string;
  cacheBehavior: CacheBehavior;
}

export interface ApiKeyUpdateScopesFormValues {
  permissions: string[];
  allowedCidrs: string[];
}
