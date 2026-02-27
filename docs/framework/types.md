# @granit/types

Types TypeScript partagés entre les applications Digital Dynamics.

## Interfaces

### `KeycloakUserInfo`

Claims OIDC standard retournés par `keycloak.loadUserInfo()`.

```typescript
import type { KeycloakUserInfo } from '@granit/types';

interface KeycloakUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}
```

### `PaginatedResponse<T>`

Enveloppe générique pour les réponses paginées des APIs REST.

```typescript
import type { PaginatedResponse } from '@granit/types';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Exemple d'utilisation
type UserPage = PaginatedResponse<User>;
```

## Peer dependencies

Aucune.
