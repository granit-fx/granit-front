# @granit/utils

Utilitaires partagés — classes CSS Tailwind et formatage — pour les applications Digital Dynamics.

## API

### `cn(...inputs: ClassValue[]): string`

Fusionne des classes Tailwind CSS avec résolution des conflits (via `clsx` + `tailwind-merge`).

```typescript
import { cn } from '@granit/utils';

cn('px-4 py-2', isActive && 'bg-primary', className);
// Résout les conflits : cn('p-4', 'p-2') → 'p-2'
```

### `formatNumber(value: number, opts?: Intl.NumberFormatOptions): string`

Formate un nombre avec séparateurs de milliers (locale `en-US`).

```typescript
formatNumber(1_234_567);                      // "1,234,567"
formatNumber(0.125, { style: 'percent' });    // "12.5%"
formatNumber(42.5, { maximumFractionDigits: 0 }); // "43"
```

### `formatDate(date: string | Date): string`

Formate une date au format long lisible (ex : `"February 27, 2026"`).

```typescript
formatDate('2026-02-27');        // "February 27, 2026"
formatDate(new Date());          // date du jour au format long
```

### `formatDateTime(date: string | Date): string`

Formate une date avec l'heure (ex : `"February 27, 2026 14:30:00"`).

### `formatTimeAgo(date: string | Date): string`

Formate une date en temps relatif (ex : `"2 hours ago"`, `"about 1 month ago"`).

### `calculatePercentage(value: number, total: number): number`

Calcule un pourcentage arrondi à l'entier le plus proche. Retourne `0` si `total === 0`.

```typescript
calculatePercentage(25, 100);  // 25
calculatePercentage(1, 3);     // 33
calculatePercentage(5, 0);     // 0  — pas de division par zéro
```

## Peer dependencies

- `clsx`
- `tailwind-merge`
- `date-fns`
