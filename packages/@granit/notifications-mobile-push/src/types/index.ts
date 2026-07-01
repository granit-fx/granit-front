import type { ISODateString } from '@granit/types';

export type MobilePlatform = 'Android' | 'Ios';

/** Write DTO for token registration. Mirrors `MobilePushTokenRegisterRequest` from .NET. */
export interface MobilePushTokenRegisterRequest {
  readonly deviceToken: string;
  readonly platform: MobilePlatform;
}

export interface MobilePushTokenResponse {
  /** Masked preview of the stored device token (the full token is never returned). */
  readonly deviceTokenPreview: string;
  readonly platform: MobilePlatform;
  readonly createdAt: ISODateString;
}
