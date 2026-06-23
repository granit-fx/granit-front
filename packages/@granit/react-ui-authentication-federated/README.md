# @granit/react-ui-authentication-federated

The **federated (external-IdP) login landing** for Granit apps — the provider-agnostic
"sign in" screen shown before redirecting to the IdP. The federated parallel to
[`@granit/react-ui-authentication-local`](../react-ui-authentication-local) (which carries the
_local_ OpenIddict login forms).

It does **not** render a credentials form (the IdP owns that). It shows a branded sign-in button
that calls `login()`, surfaces an `?error=<code>` auth error, and redirects home when already
authenticated.

## Usage

```tsx
import {
  FederatedLoginPage,
  authFederatedTranslationsEn,
} from '@granit/react-ui-authentication-federated';

i18n.addResourceBundle('en', 'translation', authFederatedTranslationsEn, true, true);

// Host wrapper injects the auth state + public layout:
const { login, loading, authenticated } = useAuth();
<FederatedLoginPage
  login={login}
  loading={loading}
  authenticated={authenticated}
  layout={PublicLayout}
/>;
```
