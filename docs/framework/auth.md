# @granit/auth

Couche d'authentification Keycloak partagée : hook d'initialisation, factory de contexte
React typé, et mock provider pour les tests et Storybook.

## API

### `useKeycloakInit(config: KeycloakCoreConfig): KeycloakCoreResult`

Hook d'initialisation Keycloak partagé (web uniquement — sans logique Capacitor).

Gère automatiquement :

- Instanciation Keycloak avec PKCE S256
- `check-sso` au démarrage (configurable via `silentCheckSso`)
- Fallback SSO pour Safari (`silentCheckSsoFallback`)
- Chargement des infos utilisateur (`loadUserInfo` ou `tokenParsed`)
- Renouvellement automatique du token toutes les 60 secondes
- Wiring du Bearer token vers `@granit/api-client` (via `setTokenGetter`)
- Remontée des événements du cycle de vie Keycloak (callbacks optionnels)

```typescript
import { useKeycloakInit } from '@granit/auth';

const {
  keycloak, keycloakRef, authenticated, loading, user,
  login, logout, register,
  hasRealmRole, hasResourceRole,
  isTokenExpired, tokenParsed,
} = useKeycloakInit({
  url:      import.meta.env.VITE_KEYCLOAK_URL,
  realm:    import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  silentCheckSso: true, // false sur Capacitor native

  // Callbacks du cycle de vie (tous optionnels)
  onTokenExpired:    () => logger.warn('Token expiré'),
  onAuthRefreshError:() => logger.error('Échec du refresh token'),
  onAuthLogout:      () => logger.info('Session Keycloak terminée'),
  onEvent:           (event, error) => logger.debug(`KC: ${event}`, error),
});
```

`keycloakRef` expose l'instance Keycloak brute pour les apps qui ont besoin de construire
des URLs de login/logout personnalisées (ex : schéma URL custom sur Capacitor).

### `KeycloakCoreResult`

Le hook retourne tous les champs de `BaseAuthContextType` plus :

| Champ | Type | Description |
| --- | --- | --- |
| `keycloakRef` | `Ref<Keycloak \| null>` | Ref vers l'instance Keycloak brute |
| `login(options?)` | `(LoginOptions?) => void` | Redirige vers la page de login |
| `logout(options?)` | `(LogoutOptions?) => void` | Redirige vers la page de logout |
| `register(options?)` | `(Omit<LoginOptions, 'action'>?) => void` | Raccourci pour `login({ action: 'register' })` |
| `hasRealmRole(role)` | `(string) => boolean` | Vérifie un rôle au niveau du realm |
| `hasResourceRole(role, resource?)` | `(string, string?) => boolean` | Vérifie un rôle au niveau d'une ressource |
| `isTokenExpired(minValidity?)` | `(number?) => boolean` | Vérifie si le token expire dans les `n` secondes |
| `tokenParsed` | `Record<string, unknown> \| undefined` | Payload JWT décodé |

### `createAuthContext<T extends BaseAuthContextType>()`

Factory générique de contexte d'authentification typé. Retourne `{ AuthContext, useAuth }`.

```typescript
import { createAuthContext, type BaseAuthContextType } from '@granit/auth';

// Définir le type étendu de l'application
interface AuthContextType extends BaseAuthContextType {
  hasAdminRole: boolean; // champ spécifique à l'app
}

// Créer le contexte et le hook typés
export const { AuthContext, useAuth } = createAuthContext<AuthContextType>();
```

`useAuth()` lève une erreur explicite si appelé hors d'un `AuthContext.Provider`.

### `createMockProvider<T>(AuthContext, value): React.FC`

Factory de provider mock pour Storybook et tests unitaires. Utilise le même `AuthContext`
que le provider réel — aucun double contexte.

```typescript
import { createMockProvider } from '@granit/auth';
import { AuthContext } from './auth-context';

export const MockAuthProvider = createMockProvider(AuthContext, {
  keycloak:      null,
  authenticated: true,
  loading:       false,
  user: {
    sub:  'mock-001',
    name: 'Test User',
    email: 'test@example.com',
  },
  hasAdminRole: true,
  login:  () => {},
  logout: () => {},
});
```

## Interfaces

### `BaseAuthContextType`

Interface de base partagée par toutes les applications.

```typescript
interface BaseAuthContextType {
  keycloak:      Keycloak | null; // null avant la fin de l'init
  authenticated: boolean;
  loading:       boolean;
  user:          KeycloakUserInfo | null;
  login:         () => void;
  logout:        () => void;
}
```

### `KeycloakCoreConfig`

```typescript
interface KeycloakCoreConfig {
  url:              string;
  realm:            string;
  clientId:         string;
  silentCheckSso?:  boolean; // défaut : true — passer false sur Capacitor

  /**
   * Fallback vers une redirection `check-sso` classique quand l'iframe
   * silent échoue (ex : Safari avec blocage des cookies tiers).
   * Défaut : true
   */
  silentCheckSsoFallback?: boolean;

  /**
   * Extraire les infos utilisateur du JWT décodé (tokenParsed) au lieu
   * d'appeler le endpoint /userinfo. Évite un aller-retour réseau mais
   * nécessite que les mappers Keycloak incluent les claims dans le token.
   * Défaut : false (appel à loadUserInfo())
   */
  useTokenClaims?: boolean;

  // -- Callbacks du cycle de vie (tous optionnels) --
  onTokenExpired?:     () => void;
  onAuthRefreshError?: () => void;
  onAuthLogout?:       () => void;
  onEvent?:            (event: KeycloakEvent, error?: unknown) => void;
}
```

### `LoginOptions`

Options transmises à `keycloak.login()`. Tous les champs sont optionnels.

```typescript
interface LoginOptions {
  redirectUri?: string;
  idpHint?:     string;  // Bypass la page Keycloak → IDP directement
  loginHint?:   string;  // Pré-remplit le champ email/username
  locale?:      string;  // Force la locale de l'UI Keycloak (ex : "fr")
  action?:      'register' | string;
  prompt?:      'login' | 'consent' | 'none';
  scope?:       string;  // Scopes OAuth supplémentaires (espace-délimités)
  maxAge?:      number;  // Durée max depuis dernière auth (secondes)
}
```

### `LogoutOptions`

```typescript
interface LogoutOptions {
  redirectUri?: string; // URL de redirection après déconnexion
}
```

### `KeycloakEvent`

Union des événements du cycle de vie Keycloak remontés via `onEvent`.

```typescript
type KeycloakEvent =
  | 'onReady'
  | 'onAuthSuccess'
  | 'onAuthError'
  | 'onAuthRefreshSuccess'
  | 'onAuthRefreshError'
  | 'onAuthLogout'
  | 'onTokenExpired';
```

## Événements du cycle de vie

Le hook wires les callbacks Keycloak suivants. Ils peuvent être utilisés
individuellement ou via le handler générique `onEvent`.

| Événement | Callback dédié | Effet sur l'état |
| --- | --- | --- |
| Token expiré | `onTokenExpired` | Aucun (le refresh automatique s'en charge) |
| Échec du refresh | `onAuthRefreshError` | `authenticated` → `false` |
| Session terminée | `onAuthLogout` | `authenticated` → `false`, `user` → `null` |
| Refresh réussi | — | Met à jour `user` si `useTokenClaims` est actif |
| Auth réussie | — | — |
| Erreur d'auth | — | `error` passé à `onEvent` |
| Ready | — | — |

Quand `useTokenClaims` est activé, l'utilisateur est automatiquement mis à jour
à partir du `tokenParsed` après chaque refresh de token réussi.

## Vérification des rôles

```typescript
// Rôle au niveau du realm
if (hasRealmRole('admin')) { /* ... */ }

// Rôle au niveau d'une ressource (client Keycloak)
if (hasResourceRole('manage-users', 'guava-api')) { /* ... */ }
```

Les deux méthodes retournent `false` si l'utilisateur n'est pas authentifié.

## Extensions par application

| Application | Champs supplémentaires |
| --- | --- |
| `guava-front` | `register: () => void` |
| `guava-admin` | `hasAdminRole: boolean` |

## Types exportés

| Export | Type | Description |
| --- | --- | --- |
| `BaseAuthContextType` | `interface` | Interface de base du contexte auth |
| `KeycloakCoreConfig` | `interface` | Configuration du hook d'init |
| `KeycloakCoreResult` | `interface` | Résultat du hook d'init |
| `KeycloakEvent` | `type` | Union des événements du cycle de vie |
| `LoginOptions` | `interface` | Options de login |
| `LogoutOptions` | `interface` | Options de logout |

## Peer dependencies

- `react`
- `keycloak-js`
- `@granit/types`
