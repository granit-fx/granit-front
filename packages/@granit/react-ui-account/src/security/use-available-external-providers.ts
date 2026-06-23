// ---------------------------------------------------------------------------
// External login providers — seam over the SDK config selector.
//
// The available providers are the backend's source of truth: the anonymous
// `GET /account/config` endpoint advertises `externalProviders`, surfaced by the
// SDK's `useAvailableExternalProviders` (a selector over `useAccountSettings`).
// There is no hardcoded provider registry in the front — branding is keyed by
// the provider `type` in `external-provider-icon.tsx`, and the button label is
// the backend-supplied `displayName`.
// ---------------------------------------------------------------------------

export {
  useAvailableExternalProviders,
  type AvailableExternalProviders,
} from '@granit/react-account';
export type { ExternalLoginProvider } from '@granit/account';
