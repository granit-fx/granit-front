# Patterns

Catalogue des design patterns identifiés dans granit-front, organisés par catégorie.

## Patterns de création

| Pattern | Fichier | Rôle |
| --- | --- | --- |
| [Factory](creation/factory.md) | `createLogger`, `createApiClient`, `createAuthContext`, `createMockProvider` | Produire des instances pré-configurées |
| [Module Singleton](creation/module-singleton.md) | `setTokenGetter` dans `@granit/api-client` | État global partagé au niveau du module ES |

## Patterns de structure

| Pattern | Fichier | Rôle |
| --- | --- | --- |
| [Adapter](structure/adapter.md) | `useKeycloakInit` dans `@granit/auth` | Adapter l'API Keycloak native vers des hooks React typés |

## Patterns de comportement

| Pattern | Fichier | Rôle |
| --- | --- | --- |
| [Strategy](behaviour/strategy.md) | `LogTransport` dans `@granit/logger` | Transports de logs interchangeables |
| [Interceptor](behaviour/interceptor.md) | Intercepteur Axios dans `@granit/api-client` | Pipeline transparent de requêtes HTTP |
| [Observer](behaviour/observer.md) | Callbacks lifecycle dans `@granit/auth` | Réagir aux événements d'authentification |

## Patterns React

| Pattern | Fichier | Rôle |
| --- | --- | --- |
| [Provider](react/provider.md) | `createAuthContext<T>` + `useAuth` | Injection de dépendances via React Context |
| [Hook Composition](react/hook-composition.md) | `useKeycloakInit` → `AuthProvider` applicatif | Composer des hooks framework avec de la logique applicative |
