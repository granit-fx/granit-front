# Guide de migration

## `extraProperties` → `metadata` (renommage framework-wide)

**Date** : 2026-04-25
**Packages affectés** : `@granit/identity` (0.3.0),
`@granit/openiddict-admin` (0.2.0), `@granit/reference-data` (0.3.0),
et leurs `react-*` correspondants.

### Contexte

Le framework Granit aligne sa terminologie sur le standard de l'industrie
(Stripe, ORB, AWS, Kubernetes, Shopify) : le champ d'extensibilité
d'entité s'appelle désormais `metadata`. Voir
[Granit dotnet PR #1209](https://github.com/granit-fx/granit-dotnet/pull/1209)
pour le détail côté backend.

Côté frontend, le wire format JSON change en conséquence : `extraProperties`
n'existe plus, remplacé par `metadata` dans les types TypeScript exportés
et toutes les fixtures de test.

### Impact sur les consommateurs

Sed mécanique sur le code applicatif :

```bash
git ls-files '*.ts' '*.tsx' '*.json' | xargs sed -i \
  -e 's/extraProperties/metadata/g' \
  -e 's/ExtraProperties/Metadata/g' \
  -e 's/ExtraProperty/Metadata/g'
```

Et bumper les dépendances dans `package.json` :

```diff
- "@granit/identity": "^0.2.0",
+ "@granit/identity": "^0.3.0",
- "@granit/openiddict-admin": "^0.1.0",
+ "@granit/openiddict-admin": "^0.2.0",
- "@granit/reference-data": "^0.2.0",
+ "@granit/reference-data": "^0.3.0",
- "@granit/react-identity": "^0.2.0",
+ "@granit/react-identity": "^0.3.0",
- "@granit/react-openiddict-admin": "^0.1.0",
+ "@granit/react-openiddict-admin": "^0.2.0",
- "@granit/react-reference-data": "^0.2.0",
+ "@granit/react-reference-data": "^0.3.0",
```

### Coordination avec le backend

Le backend doit être déployé **avant** la mise en production du frontend :
les anciens clients qui envoient `{ extraProperties: ... }` recevront un
`400 Bad Request` (champ inconnu, pas de fallback de compatibilité).
Idem dans l'autre sens : un nouveau client face à un ancien backend ne
recevra pas le champ attendu.

## Pagination : migration vers `@granit/query-engine`

**Date** : 2026-03-08

### Contexte

Les hooks de pagination (`usePaginatedFetch`) étaient dupliqués dans `@granit/notifications`
et `@granit/timeline`. La logique est désormais centralisée dans `@granit/query-engine` sous deux
primitives :

- `useInfiniteScroll` — chargement progressif (load more / infinite scroll)
- `usePagination` — navigation classique par page

### Impact sur les consommateurs

#### `@granit/notifications`

L'ancien `usePaginatedFetch` est maintenu comme alias de rétrocompatibilité.
Aucun changement requis immédiatement, mais il est recommandé de migrer :

```diff
- import { usePaginatedFetch } from '@granit/notifications';
+ import { useInfiniteScroll } from '@granit/query-engine';
```

Les types suivent le même schéma :

| Ancien                     | Nouveau                    |
| -------------------------- | -------------------------- |
| `usePaginatedFetch`        | `useInfiniteScroll`        |
| `PaginatedPage`            | `InfiniteScrollPage`       |
| `UsePaginatedFetchOptions` | `UseInfiniteScrollOptions` |
| `UsePaginatedFetchResult`  | `UseInfiniteScrollReturn`  |

#### `@granit/timeline`

`useTimeline` compose désormais par-dessus `useInfiniteScroll` en interne.
Aucun changement d'API publique.

#### Nouvelles dépendances

Les packages `@granit/timeline` et `@granit/notifications` ont un nouveau
`peerDependency` sur `@granit/query-engine`. Assurez-vous qu'il est installé :

```bash
pnpm add @granit/query-engine
```

### Renommage des types de retour

Les interfaces de retour des hooks ont été standardisées :

| Ancien                             | Nouveau                            |
| ---------------------------------- | ---------------------------------- |
| `UseTimelineResult`                | `UseTimelineReturn`                |
| `UseTimelineActionsResult`         | `UseTimelineActionsReturn`         |
| `UseTimelineFollowersResult`       | `UseTimelineFollowersReturn`       |
| `UseWorkflowStatusResult`          | `UseWorkflowStatusReturn`          |
| `UseWorkflowHistoryResult`         | `UseWorkflowHistoryReturn`         |
| `UseWorkflowTransitionResult`      | `UseWorkflowTransitionReturn`      |
| `UseNotificationsResult`           | `UseNotificationsReturn`           |
| `UseUnreadCountResult`             | `UseUnreadCountReturn`             |
| `UseRealTimeNotificationsResult`   | `UseRealTimeNotificationsReturn`   |
| `UseEntityActivityFeedResult`      | `UseEntityActivityFeedReturn`      |
| `UseNotificationPreferencesResult` | `UseNotificationPreferencesReturn` |

Les anciens noms ne sont plus exportés. Mettez à jour vos imports :

```diff
- import type { UseTimelineResult } from '@granit/timeline';
+ import type { UseTimelineReturn } from '@granit/timeline';
```

### Classes d'erreur

De nouvelles classes d'erreur domaine sont disponibles dans `@granit/api-client` :

```typescript
import { HttpError, ValidationError, TimeoutError } from '@granit/api-client';
```

Ces classes remplacent les `Error` génériques et offrent un typage structuré
(`statusCode`, `problemDetails`, `fieldErrors`).
