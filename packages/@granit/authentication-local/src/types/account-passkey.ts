// ---------------------------------------------------------------------------
// Passkey management — mirrors Granit.Identity.Local.Endpoints .NET contract
// (anonymous login assertion lives in account-login.ts)
// ---------------------------------------------------------------------------

import type { ISODateString } from '@granit/types';

/** Request body for `POST {basePath}/passkeys/register/complete`. */
export interface PasskeyRegistrationRequest {
  /** Serialized `AuthenticatorAttestationResponse` JSON from `navigator.credentials.create()`. */
  readonly credentialJson: string;
  /** Friendly name for the credential — required key, may be `null` (max 100 when set). */
  readonly name: string | null;
}

/** Request body for `PATCH {basePath}/passkeys/{id}`. */
export interface PasskeyRenameRequest {
  readonly name: string;
}

/** A registered WebAuthn passkey — response item from `GET {basePath}/passkeys`. */
export interface PasskeyInfoResponse {
  readonly id: string;
  readonly name: string | null;
  readonly createdAt: ISODateString;
  readonly lastUsedAt: ISODateString | null;
}
