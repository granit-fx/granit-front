# Guide de migration

## TanStack Table v8 → v9 (`ColumnDef` → `DataTableColumnDef`)

**Date** : 2026-08-10
**Packages affectés** : `@granit/react-ui-kit` et les 28 packages
`@granit/react-ui-*` qui exposent des factories de colonnes.

### Contexte

TanStack Table v9 rend les features optionnelles et propage la carte de
features obtenue dans tous les types du core, sous la forme d'un générique
`TFeatures` placé **en tête** :

```diff
- type ColumnDef<TData, TValue = unknown>
+ type ColumnDef<TFeatures, TData, TValue = unknown>
```

Le jeu de features fait donc désormais partie du contrat de type : une
`ColumnDef` construite avec une carte de features différente n'est pas
assignable. Comme 28 packages passent leurs colonnes aux tables de
`@granit/react-ui-kit`, le framework fige **un seul** jeu de features,
exporté par le kit sous le nom `dataTableFeatures`.

Le hook change également de nom (`useReactTable` → `useTable`) et les row
models deviennent des slots ; le core row model est créé automatiquement,
`getCoreRowModel()` n'existe plus.

### Impact sur les consommateurs

Les alias exportés par `@granit/react-ui-kit` conservent une signature à
deux paramètres, donc le code applicatif ne manipule jamais `TFeatures` :

| v8 (`@tanstack/react-table`) | v9 (`@granit/react-ui-kit`)  |
| ---------------------------- | ---------------------------- |
| `ColumnDef<T, V>`            | `DataTableColumnDef<T, V>`   |
| `CellContext<T, V>`          | `DataTableCellContext<T, V>` |
| `Row<T>`                     | `DataTableRow<T>`            |
| `Cell<T, V>`                 | `DataTableCell<T, V>`        |
| `Table<T>`                   | `DataTableInstance<T>`       |

Sed mécanique sur le code applicatif :

```bash
git ls-files '*.ts' '*.tsx' | xargs sed -i \
  -e 's/\bColumnDef</DataTableColumnDef</g' \
  -e 's/\bCellContext</DataTableCellContext</g'
```

puis rediriger l'import de type vers le kit :

```diff
- import type { ColumnDef } from '@tanstack/react-table';
+ import type { DataTableColumnDef } from '@granit/react-ui-kit';
```

Les composants qui construisent eux-mêmes une table passent au nouveau
hook et déclarent le jeu de features du framework :

```diff
- import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
+ import { dataTableFeatures } from '@granit/react-ui-kit';
+ import { useTable } from '@tanstack/react-table';

- const table = useReactTable({
+ const table = useTable({
+   features: dataTableFeatures,
    data,
    columns,
-   getCoreRowModel: getCoreRowModel(),
  });
```

Deux points de vigilance :

- Les génériques qui alimentent une `DataTableColumnDef` doivent satisfaire
  `RowData` (`Record<string, any> | Array<any>`) : un `<T>` non contraint ne
  compile plus, il faut écrire `<T extends RowData>`.
- Un `vi.mock('@granit/react-ui-kit')` total prive les composants de table
  de `dataTableFeatures`. Utiliser un mock partiel avec `importOriginal`.

### Row models et rendu serveur

Aucune row model factory n'est enregistrée dans `dataTableFeatures` : les
tables Granit paginent, trient et filtrent côté serveur via
`@granit/query-engine`. Ajouter un `sortedRowModel` ou un
`paginatedRowModel` re-trierait et re-découperait côté client des pages
déjà résolues par le backend.

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
