# Guide de migration

## Alignement SaaS — Catalog + Metering hybride + Customer-Balance + Invoicing

**Date** : 2026-04-25
**Packages affectés** :

- nouveaux : `@granit/catalog` (0.1.0), `@granit/react-catalog` (0.1.0)
- mis à jour : `@granit/metering` (0.2.0) + `@granit/react-metering` (0.2.0),
  `@granit/subscriptions` (0.2.0) + `@granit/react-subscriptions` (0.2.0),
  `@granit/customer-balance` (0.2.0) + `@granit/react-customer-balance` (0.2.0),
  `@granit/invoicing` (0.2.0) + `@granit/react-invoicing` (0.2.0)

### Contexte

Cinq phases d'alignement sur ORB ont atterri côté backend en `develop` :

| Phase backend                                                                  | PR / scope                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1. `Granit.Catalog` (Product comme agrégat partagé)                            | #1184                                                           |
| 2. Metering hybride (lifecycle, CountDistinct, recompute, backfill, deprecate) | #1187 → #1196                                                   |
| 3. Subscriptions overrides/phases/tiered (entités domaine internes)            | #1200, #1202 — pas d'endpoints HTTP, donc pas d'impact frontend |
| 4. Customer-Balance — admin debit + pré-expiration                             | #1205, #1206                                                    |
| 5. Invoicing — `productId` sur `InvoiceLineItem` (ADR-036)                     | #1208                                                           |

Cette PR propage ces changements côté frontend.

### `@granit/catalog` (nouveau)

```diff
+ "@granit/catalog": "^0.1.0",
+ "@granit/react-catalog": "^0.1.0",
```

API : `listPublishedProducts`, `getProductById`, `getProductBySku`,
`createProduct`, `updateProduct`, `updateProductMetadata`, `publishProduct`,
`archiveProduct`, `addProductExternalMapping`, `removeProductExternalMapping`,
`listProducts` (QueryEngine).

Hooks React : `usePublishedProducts`, `useProduct`, `useProductBySku`,
`useCreateProduct`, `useUpdateProduct`, `useUpdateProductMetadata`,
`usePublishProduct`, `useArchiveProduct`, `useAddProductExternalMapping`,
`useRemoveProductExternalMapping`.

Permissions : `Catalog.Products.{Read,Manage}`.

### `@granit/metering` (BREAKING)

#### Lifecycle — `activated` déprécié au profit de `lifecycleStatus`

```diff
- if (meter.activated) { /* ... */ }
+ if (meter.lifecycleStatus === 'Published') { /* ... */ }
```

Le champ `activated` reste exposé pour une release de transition mais
sera retiré au prochain MAJOR.

#### `useDeactivateMeterDefinition` déprécié

Le cycle de vie devient `Publish → Archive`. Migrer :

```diff
- const deactivate = useDeactivateMeterDefinition();
- await deactivate.mutateAsync(meterId);
+ const archive = useArchiveMeterDefinition();
+ await archive.mutateAsync(meterId);
```

#### Nouveaux hooks et fonctions API

- `usePublishMeterDefinition()` — fait passer un meter `Draft` à `Published`
- `useArchiveMeterDefinition()` — `Published` → `Archived`
- `useRecomputeMeterUsage()` — recalcul des agrégats sur une fenêtre
- `useBackfillUsageEvents()` — ingestion historique (jusqu'à 365 jours)
- `useDeprecateMeterEvent()` — soft-delete d'un événement individuel

#### Nouvelle valeur d'enum `AggregationType.CountDistinct`

Pour `CountDistinct`, `MeterDefinitionCreateRequest.distinctProperty` est
**obligatoire** (le validateur backend rejette sinon).

```ts
const create = useCreateMeterDefinition();
await create.mutateAsync({
  name: 'Active Users',
  unit: 'users',
  aggregationType: 'CountDistinct',
  distinctProperty: 'user_id',
});
```

#### Nouveau champ `productId`

Réponses des meters et `MeterDefinitionCreateRequest` portent désormais
un `productId` optionnel (référence soft vers un `Granit.Catalog.Product`).
Aucune action requise — le champ est accepté `null`.

### `@granit/subscriptions`

Ajout du champ `productId` sur `PlanPriceResponse` (obligatoire dans
les réponses backend, peut être `null`) et `CreatePriceVersionRequest`
(optionnel). Si tes fixtures ou mocks définissent un `PlanPriceResponse`
manuellement, ajouter `productId: null`.

### `@granit/customer-balance`

Nouveau hook `useDebitCustomerBalance` pour `POST /balance/debit`.
Permission backend : `CustomerBalance.Credits.Manage` (réutilisée pour
les opérations de débit admin).

```ts
const debit = useDebitCustomerBalance();
await debit.mutateAsync({
  amount: 50,
  currency: 'EUR',
  reason: 'Manual correction',
  referenceId: 'adj-2026-04-25-001', // optional, idempotent retries
  referenceType: 'AdminAdjustment',
});
```

### `@granit/invoicing`

Nouveau champ `productId` sur `InvoiceLineItemResponse` (peut être
`null`). Le type `sourceType` est désormais typé strictement comme
`InvoiceSourceType` (`'Subscription' | 'Usage' | 'OneShot' | 'Credit'`)
au lieu de `string`. Les fixtures qui posaient un `sourceType: 'X'`
arbitraire compilent toujours tant que la chaîne est l'une des quatre
valeurs autorisées.

**Convention ADR-036** (enforced côté backend, pas côté front) :
les lignes `Subscription` et `Usage` portent un `sourceId` au format
Guid. Les fixtures fournies par `@granit/react-invoicing/testing` ont
été ajustées pour respecter cette règle.

### Bump `package.json`

```diff
- "@granit/metering": "^0.1.0",
+ "@granit/metering": "^0.2.0",
- "@granit/react-metering": "^0.1.0",
+ "@granit/react-metering": "^0.2.0",
- "@granit/subscriptions": "^0.1.0",
+ "@granit/subscriptions": "^0.2.0",
- "@granit/react-subscriptions": "^0.1.0",
+ "@granit/react-subscriptions": "^0.2.0",
- "@granit/customer-balance": "^0.1.0",
+ "@granit/customer-balance": "^0.2.0",
- "@granit/react-customer-balance": "^0.1.0",
+ "@granit/react-customer-balance": "^0.2.0",
- "@granit/invoicing": "^0.1.0",
+ "@granit/invoicing": "^0.2.0",
- "@granit/react-invoicing": "^0.1.0",
+ "@granit/react-invoicing": "^0.2.0",
```

### Coordination déploiement

Le backend ORB-aligned doit être déployé **avant** la mise en production
du frontend, sinon les nouveaux hooks (`publish`, `archive`, `recompute`,
`backfill`, `deprecate`, `debit`) recevront un `404` ou `405`.

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
