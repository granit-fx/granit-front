import type { EntityId, ISODateString } from '@granit/types';

// ---------------------------------------------------------------------------
// Account passkey (WebAuthn) types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Branded passkey identifier. */
export type PasskeyId = EntityId<'Passkey'>;

/** Passkey descriptor returned by `GET /passkeys`. */
export interface AccountPasskeyInfo {
  readonly id: PasskeyId;
  readonly name: string | null;
  readonly createdAt: ISODateString;
  readonly lastUsedAt: ISODateString | null;
}

/** Request body for `POST /passkeys/register/complete`. */
export interface AccountPasskeyRegistrationRequest {
  readonly credentialJson: string;
  readonly name?: string;
}

/** Response from `POST /passkeys/register/complete`. */
export interface AccountPasskeyCreatedResponse {
  readonly id: PasskeyId;
  readonly name: string | null;
  readonly createdAt: ISODateString;
}

/** Request body for `PATCH /passkeys/{id}`. */
export interface AccountPasskeyRenameRequest {
  readonly name: string;
}
