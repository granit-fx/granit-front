import type { ISODateString } from '@granit/types';

/** API key type. Mirrors Granit.Authentication.ApiKeys.ApiKeyType .NET. */
export type ApiKeyType = 'Secret' | 'Publishable' | 'Webhook' | 'Ephemeral';

/** Cache behavior for API key lookups. */
export type CacheBehavior = 'Normal' | 'NoCache';

/** API key response DTO. */
export interface ApiKeyResponse {
  readonly id: string;
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly permissions: readonly string[];
  readonly allowedCidrs: readonly string[];
  readonly expiresAt: ISODateString | null;
  readonly lastUsedAt: ISODateString | null;
  readonly revokedAt: ISODateString | null;
  readonly cacheBehavior: CacheBehavior;
  readonly createdAt: ISODateString;
}

/** Request to create a new API key. */
export interface ApiKeyCreateRequest {
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly permissions?: readonly string[];
  readonly allowedCidrs?: readonly string[];
  readonly expiresAt?: ISODateString;
  readonly cacheBehavior?: CacheBehavior;
}

/** Response after creating a new API key (includes the raw secret). */
export interface ApiKeyCreateResponse {
  readonly id: string;
  readonly rawSecret: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly name: string;
  readonly type: ApiKeyType;
  readonly environment: string;
  readonly expiresAt: ISODateString | null;
}

/** Response after rotating an API key. */
export interface ApiKeyRotateResponse {
  readonly newKeyId: string;
  readonly rawSecret: string;
  readonly prefix: string;
  readonly lastFourChars: string;
  readonly oldKeyId: string;
}

/** Request to update API key scopes. */
export interface ApiKeyUpdateScopesRequest {
  readonly permissions: readonly string[];
  readonly allowedCidrs: readonly string[];
}
