import type { UserDeviceResponse } from './types/index';
import type { DeviceKind } from '@granit/identity-abstractions';

/**
 * Localized strings needed to compose a device label. Apps resolve these from
 * their i18n layer (e.g. the `identity` resource bundle shipped by
 * `@granit/react-identity`) and pass them in — this keeps the composer headless
 * and framework-agnostic.
 */
export interface DeviceLabelStrings {
  /** Localized name for each device kind (e.g. `'MobileApp'` → "Mobile app"). */
  readonly kind: Record<DeviceKind, string>;
  /** Connector between the client and its OS, composed as `"{client} {on} {os}"` (e.g. "on" / "sur"). */
  readonly on: string;
}

/**
 * Compose a human-readable, localized device label from a {@link UserDeviceResponse}.
 *
 * The backend no longer ships a raw device string — it exposes a {@link DeviceKind}
 * plus OS and browser families, and leaves labelling to the client. For browser
 * kinds the browser family leads (e.g. "Chrome on Windows"); for every other
 * kind the localized kind name leads (e.g. "Mobile app on iOS"). The OS is
 * appended only when known.
 *
 * @example
 * ```ts
 * composeDeviceLabel({ kind: 'Browser', browser: 'Firefox', operatingSystem: 'Linux' }, labels);
 * // → "Firefox on Linux"
 * composeDeviceLabel({ kind: 'MobileApp', browser: null, operatingSystem: 'iOS' }, labels);
 * // → "Mobile app on iOS"
 * ```
 */
export function composeDeviceLabel(
  device: Pick<UserDeviceResponse, 'kind' | 'operatingSystem' | 'browser'>,
  labels: DeviceLabelStrings
): string {
  const { kind, operatingSystem, browser } = device;
  const isBrowser = kind === 'Browser' || kind === 'BrowserExtension';
  const client = isBrowser && browser ? browser : labels.kind[kind];
  return operatingSystem ? `${client} ${labels.on} ${operatingSystem}` : client;
}
