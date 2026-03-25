# Guide de migration

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
