# @granit/api-client

Factory Axios avec intercepteur Bearer token pour les applications Digital Dynamics.

## API

### `createApiClient(config: ApiClientConfig): AxiosInstance`

Crée une instance Axios pré-configurée avec un intercepteur de requête qui injecte
automatiquement le Bearer token Keycloak à chaque appel.

```typescript
import { createApiClient } from '@granit/api-client';

export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000, // optionnel, défaut : 10 000 ms
});
```

### `setTokenGetter(getter: () => Promise<string | undefined>): void`

Enregistre la fonction de récupération du token Keycloak. Cette fonction est appelée
automatiquement par `useKeycloakInit` de `@granit/auth` — il n'est pas nécessaire de
l'appeler manuellement si `@granit/auth` est utilisé.

```typescript
import { setTokenGetter } from '@granit/api-client';

// Exemple d'appel manuel (sans @granit/auth)
setTokenGetter(async () => {
  await keycloak.updateToken(5);
  return keycloak.token;
});
```

### Gestion des erreurs 401/403

La gestion des erreurs 401/403 est intentionnellement **laissée à l'application** consommatrice.
Ajouter un intercepteur de réponse après la création de l'instance :

```typescript
import axios from 'axios';
import { logger } from '@/lib/logger';

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        logger.warn('[API] Session expirée — token invalide');
      } else if (error.response?.status === 403) {
        logger.warn('[API] Accès refusé — permissions insuffisantes');
      }
    }
    throw error;
  }
);
```

## Peer dependencies

- `axios`
