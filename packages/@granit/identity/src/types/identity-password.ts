import type { ISODateString } from '@granit/types';

/** Response from `GET /identity/provider/users/{userId}/password/changed-at`. */
export type IdentityPasswordChangedAtResponse = {
  readonly changedAt: ISODateString | null;
};
