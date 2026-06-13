# @granit/bff

BFF (Backend-for-Frontend) authentication types and CSRF token manager. Mirrors
the `Granit.Bff` .NET contract (`GET /bff/user`, `POST /bff/csrf-token`).

> **Sessions moved.** Listing and revoking the caller's own sessions is no
> longer a BFF concern (granit-dotnet #2692). Use the canonical, transport-
> agnostic `/sessions` (+ `/devices`) endpoints via `@granit/identity`
> (`listMySessions`, `revokeMySession`, `revokeMyOtherSessions`, `listMyDevices`)
> and `@granit/react-identity` (`useMySessions`, `useRevokeMySession`, …).

## Installation

```bash
pnpm add @granit/bff
```

## API

### Types

- `BffUser`, `BffUserResponse`, `BffUnauthenticated` -- user state
- `BffConfig` -- BFF configuration
- `BffCsrfTokenResponse` -- CSRF token issuance response

### Classes

- `CsrfManager` -- CSRF token lifecycle management

## Usage

```ts
import { CsrfManager } from '@granit/bff';
import type { BffUser } from '@granit/bff';

const csrf = new CsrfManager();
```

## License

Apache-2.0
