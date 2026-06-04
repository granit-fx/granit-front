export type MobilePlatform = 'android' | 'ios';

export interface DeviceTokenDto {
  readonly token: string;
  readonly platform: MobilePlatform;
  readonly deviceId?: string;
}

export interface MobilePushTokenResponse {
  readonly deviceToken: string;
  readonly platform: MobilePlatform;
  readonly createdAt: string;
}
