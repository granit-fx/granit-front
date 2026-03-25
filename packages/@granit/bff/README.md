# @granit/bff

BFF (Backend-for-Frontend) authentication types, CSRF token manager, and session API. Mirrors `Granit.Bff` .NET contract.

## Installation

```bash
pnpm add @granit/bff
```

## API

### Types

- `BffUser`, `BffUserResponse`, `BffUnauthenticated` -- user state
- `BffConfig` -- BFF configuration
- `BffSessionInfo`, `BffSessionListResponse` -- session management

### Classes

- `CsrfManager` -- CSRF token lifecycle management

### Functions

- `fetchBffSessions(...)` -- list active sessions
- `revokeBffSession(...)` -- revoke a specific session
- `revokeAllOtherBffSessions(...)` -- revoke all sessions except current

## Usage

```ts
import { CsrfManager, fetchBffSessions } from '@granit/bff';
import type { BffUser } from '@granit/bff';

const csrf = new CsrfManager();
const sessions = await fetchBffSessions(client, basePath);
```

## License

Apache-2.0
