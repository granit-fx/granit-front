# Règles du Design System — Granit

Guide de référence pour l'équipe. Toutes ces règles sont **obligatoires** et vérifiées en code review.

> Doc framework du design system Granit. Les tokens sémantiques et primitives
> canoniques vivent dans `@granit/ui-theme` (tokens) et `@granit/react-ui`
> (composants shadcn) ; les chemins `src/…` / `@/…` ci-dessous illustrent un
> **consommateur** (le showcase). Voir aussi `docs/frontend-foundation-architecture.md`.

## 1. Design Tokens — Source unique de vérité

Tous les tokens vivent dans `src/index.css` via `@theme inline`. Zéro `tailwind.config.js`.

### Couleurs sémantiques obligatoires

| Token                         | Usage                 | Interdit                           |
| ----------------------------- | --------------------- | ---------------------------------- |
| `bg-primary` / `text-primary` | Boutons, liens actifs | `bg-admin-600`, `bg-[#4f46e5]`     |
| `text-foreground`             | Texte principal       | `text-slate-900`, `text-[#0f172a]` |
| `bg-destructive`              | Erreurs, suppression  | `bg-red-500`, `bg-[#ef4444]`       |
| `bg-secondary`                | Fonds secondaires     | `bg-slate-100`, `bg-gray-100`      |
| `text-muted-foreground`       | Texte secondaire      | `text-slate-500`, `text-gray-500`  |
| `bg-accent`                   | Hover, fond actif     | `bg-gray-50`                       |
| `border-input`                | Bordures de champs    | `border-slate-200`                 |
| `ring-ring`                   | Focus ring            | `ring-indigo-500`                  |

### Règles strictes

- **JAMAIS** de couleurs arbitraires (`bg-[#xxx]`, `text-[#xxx]`) dans les composants applicatifs
- **JAMAIS** de couleurs Tailwind brutes (`bg-red-500`, `text-blue-600`) dans les composants applicatifs
- Les couleurs brutes (`admin-50`, `slate-200`) sont autorisées **uniquement** dans `src/components/ui/`
- Toute nouvelle couleur doit être ajoutée comme token sémantique dans `@theme`
- Pour ajouter un token : modifier `src/index.css` section `@theme`, jamais de fichier de config externe

## 2. Composants — Patterns obligatoires

### Hiérarchie des répertoires

```text
src/components/ui/          ← shadcn/ui (NE PAS MODIFIER directement)
src/components/layout/      ← Layout admin (AdminHeader, AdminSidebar, AdminLayout)
src/components/             ← Composants partagés (EntityTimeline, EntityWorkflow)
src/features/*/components/  ← Composants spécifiques à une feature
```

### Règles de composition

| Règle                       | Correct                             | Interdit                         |
| --------------------------- | ----------------------------------- | -------------------------------- |
| Modifier un composant UI    | Créer un wrapper                    | Éditer `button.tsx` directement  |
| Ajouter un composant shadcn | `pnpm dlx shadcn@latest add`        | Copier-coller manuellement       |
| Variants                    | CVA (`class-variance-authority`)    | Ternaires dans className         |
| Classes conditionnelles     | `cn()` de `@/lib/utils`             | Template literals `` `${...}` `` |
| Props typées                | `interface` explicite               | `any`, `Record<string, unknown>` |
| Exporter les variants       | `export { Button, buttonVariants }` | Export du composant seul         |

### Pattern CVA obligatoire

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const cardVariants = cva('rounded-xl border', {
  variants: {
    variant: {
      default: 'bg-card shadow-sm',
      elevated: 'bg-card card-shadow-hover',
      flat: 'bg-background border-input',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface CardProps extends VariantProps<typeof cardVariants> {
  className?: string;
}

function Card({ variant, className, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, className }))} {...props} />;
}

export { Card, cardVariants };
```

### Data attributes

Chaque composant UI doit exposer des `data-slot` pour le testing et le styling :

```tsx
<button data-slot="button" data-variant={variant} data-size={size} />
<div data-slot="card" />
<span data-slot="avatar" data-size={size} />
```

## 3. Storybook — Conventions

### Colocation obligatoire

Chaque composant visible **doit** avoir une story colocalisée :

```text
src/components/entity-timeline.tsx
src/components/entity-timeline.stories.tsx   ← story colocalisée
src/components/entity-timeline.test.tsx      ← test colocalisé

src/features/users/components/user-table.tsx
src/features/users/components/user-table.stories.tsx
```

### Nommage des titres

| Catégorie              | Pattern                    | Exemple                          |
| ---------------------- | -------------------------- | -------------------------------- |
| Introduction           | `Introduction`             | `Introduction` (top-level)       |
| Design tokens          | `Foundations/{Token}`      | `Foundations/Design Tokens`      |
| Composants UI (shadcn) | `UI Components/{Nom}`      | `UI Components/Button`           |
| Compositions partagées | `Shared Components/{Nom}`  | `Shared Components/Admin Layout` |
| Composants métier      | `Features/{Domaine}/{Nom}` | `Features/Users/User Table`      |
| Pages complètes        | `Pages/{Nom}`              | `Pages/Users`                    |

### Template de story

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MyComponent } from './my-component';

const meta = {
  title: 'Features/Users/MyComponent',
  component: MyComponent,
  tags: ['autodocs'], // OBLIGATOIRE
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Label' } };
export const Destructive: Story = { args: { variant: 'destructive' } };
```

### Règle de livraison

**Tout nouveau composant visible DOIT avoir une story Storybook AVANT le merge.**
Pas de story = pas de merge.

## 4. Responsive Design — Mobile-first

### Breakpoints

| Breakpoint | Taille    | Usage                          |
| ---------- | --------- | ------------------------------ |
| (défaut)   | < 640px   | Mobile                         |
| `sm:`      | >= 640px  | Mobile large                   |
| `md:`      | >= 768px  | Tablette                       |
| `lg:`      | >= 1024px | Desktop (breakpoint principal) |
| `xl:`      | >= 1280px | Grand écran                    |

### Patterns obligatoires

```tsx
// Correct : mobile-first, on ajoute pour desktop
<div className="px-4 sm:px-6 lg:px-8" />
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />
<div className="hidden lg:block" />   {/* Desktop uniquement */}
<div className="lg:hidden" />          {/* Mobile uniquement */}

// Interdit : desktop-first
<div className="grid grid-cols-3 sm:grid-cols-1" />
```

### Container standard

```tsx
<main className="flex-1 overflow-y-auto">
  <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</div>
</main>
```

## 5. Typographie

Fonts définis dans `@theme` : **Inter** (texte) + **JetBrains Mono** (code).

| Élément   | Classes Tailwind                        | Usage             |
| --------- | --------------------------------------- | ----------------- |
| H1        | `text-4xl font-bold tracking-tight`     | Titre de page     |
| H2        | `text-2xl font-semibold tracking-tight` | Section           |
| H3        | `text-lg font-semibold`                 | Sous-section      |
| Body      | `text-base text-foreground`             | Contenu principal |
| Secondary | `text-sm text-muted-foreground`         | Info secondaire   |
| Caption   | `text-xs text-muted-foreground`         | Labels, meta      |
| Code      | `font-mono text-sm`                     | Code inline       |

## 6. Spacing — Échelle cohérente

Toujours utiliser l'échelle Tailwind (multiples de 4px). Jamais de valeurs arbitraires (`p-[13px]`).

| Classe          | Valeur | Usage                          |
| --------------- | ------ | ------------------------------ |
| `gap-1` / `p-1` | 4px    | Micro (icônes, badges)         |
| `gap-2` / `p-2` | 8px    | Compact (boutons petits, tags) |
| `gap-3` / `p-3` | 12px   | Formulaires compacts           |
| `gap-4` / `p-4` | 16px   | **Défaut** — padding standard  |
| `gap-6` / `p-6` | 24px   | Cards, sections                |
| `gap-8` / `p-8` | 32px   | Grandes sections, hero         |

## 7. Shadows et élévation

| Classe                   | Usage                          |
| ------------------------ | ------------------------------ |
| `card-shadow`            | Cards au repos                 |
| `card-shadow-hover`      | Cards au hover (teinte indigo) |
| `header-shadow`          | Header fixe                    |
| `shadow-sm`              | Composants légers              |
| Aucune shadow + `border` | Design flat                    |

**Règle** : Maximum 3 niveaux d'élévation visibles simultanément sur un écran.

## 8. Accessibilité — WCAG 2.1 AA

Conformité cible : **WCAG 2.1 niveau AA**. Obligatoire pour le projet.

### 8.1 Perceivable (Perceptible)

**Contenu non-textuel (1.1.1)** :

- Toute image informative a un `alt` descriptif
- Images décoratives : `alt=""` ou `aria-hidden="true"`
- Icônes avec texte visible : `aria-hidden="true"` sur l'icône
- Boutons icon-only : `aria-label` obligatoire

```tsx
// Correct : bouton avec icône seule
<button aria-label="Fermer le menu">
  <X className="h-5 w-5" aria-hidden="true" />
</button>

// Correct : icône + texte visible
<button>
  <Heart className="h-4 w-4" aria-hidden="true" />
  <span>Favoris</span>
</button>

// Interdit
<div onClick={close} className="cursor-pointer">
  <X className="h-5 w-5" />
</div>
```

**Contraste (1.4.3 / 1.4.11)** :

| Élément                             | Ratio minimum | Vérification          |
| ----------------------------------- | ------------- | --------------------- |
| Texte normal (< 18px)               | 4.5:1         | Storybook addon-a11y  |
| Grand texte (>= 18px bold, >= 24px) | 3:1           | Storybook addon-a11y  |
| Éléments UI (bordures, icônes)      | 3:1           | Manuel ou DevTools    |
| Texte sur fond coloré (badges)      | 4.5:1         | Vérifier les variants |

**Redimensionnement (1.4.4)** :

- Le contenu reste lisible et fonctionnel à 200% de zoom
- Pas de scroll horizontal à 320px viewport (1.4.10)
- Utiliser des unités relatives (`rem`, `em`) — jamais de `px` fixe pour le texte

### 8.2 Operable (Utilisable)

**Navigation clavier (2.1.1)** :

- Tout élément interactif est atteignable et activable au clavier
- Ordre de tabulation logique (2.4.3) — pas de `tabindex` > 0
- Focus visible sur tous les éléments interactifs (2.4.7)
- Ne JAMAIS supprimer `outline` sans alternative

```tsx
// Correct : focus ring visible
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">

// Interdit
<button className="outline-none focus:outline-none">
```

**Pas de piège clavier (2.1.2)** :

- Les modales doivent piéger le focus à l'intérieur (focus trap)
- L'utilisateur peut toujours fermer avec `Escape`
- Utiliser les composants Radix UI qui gèrent le focus trap nativement

**Cibles tactiles (2.5.8)** :

- Taille minimum des zones cliquables : 44x44px (mobile)
- Espacement suffisant entre les cibles tactiles adjacentes
- Les boutons `icon-xs` (24px) doivent avoir du padding tactile supplémentaire sur mobile

### 8.3 Understandable (Compréhensible)

**Langue de la page (3.1.1)** :

```html
<html lang="fr"></html>
```

**Identification des erreurs (3.3.1)** :

- Les erreurs de formulaire sont identifiées et décrites en texte
- Associer les messages d'erreur au champ via `aria-describedby`
- Ne pas utiliser uniquement la couleur pour indiquer une erreur

```tsx
// Correct : erreur accessible
<div>
  <label htmlFor="email">Email</label>
  <input id="email" aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined} />
  {error && (
    <p id="email-error" role="alert" className="text-sm text-destructive">
      {error}
    </p>
  )}
</div>
```

**Labels (3.3.2)** :

- Tout champ de formulaire a un `<label>` visible ou `aria-label`
- Les placeholders ne remplacent JAMAIS les labels
- Les champs obligatoires sont marqués visuellement ET par `aria-required="true"`

### 8.4 Robust (Robuste)

**HTML valide (4.1.1)** :

- Pas de `id` en doublon dans le DOM
- Balises correctement imbriquées

**Nom, rôle, valeur (4.1.2)** :

- Les composants custom ont les rôles ARIA appropriés
- Utiliser les composants Radix UI (shadcn/ui) qui les fournissent nativement
- Les états dynamiques sont communiqués : `aria-expanded`, `aria-selected`, `aria-checked`

```tsx
// Correct : menu déroulant avec états ARIA (Radix le fait nativement)
<DropdownMenu>
  <DropdownMenuTrigger aria-label="Options">
    <MoreHorizontal />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Modifier</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Live regions (4.1.3)** :

- Les notifications et alertes utilisent `role="alert"` ou `aria-live="polite"`
- Les toasts/snackbars doivent être annoncés par les lecteurs d'écran

### 8.5 Outils de vérification

| Outil                            | Usage                      | Quand           |
| -------------------------------- | -------------------------- | --------------- |
| `@storybook/addon-a11y`          | Audit axe-core automatique | Développement   |
| Chrome DevTools Lighthouse       | Audit a11y de page         | Avant chaque MR |
| `axe-core` via Vitest            | Tests a11y automatisés     | CI/CD           |
| Navigation clavier manuelle      | Vérifier tab order, focus  | Avant chaque MR |
| Lecteur d'écran (NVDA/VoiceOver) | Test réel                  | Avant release   |

### 8.6 Checklist a11y par composant

- [ ] Rôle ARIA correct ou élément HTML sémantique
- [ ] Label accessible (texte visible, `aria-label`, ou `aria-labelledby`)
- [ ] Focus visible et navigation clavier fonctionnelle
- [ ] Contraste suffisant (texte et éléments UI)
- [ ] États communiqués (`aria-expanded`, `aria-disabled`, `aria-invalid`)
- [ ] Fonctionne à 200% de zoom
- [ ] Zéro violation axe-core dans Storybook

## 9. Imports et organisation du code

### Ordre des imports (enforced par ESLint)

```tsx
// 1. React
import React from 'react';

// 2. Librairies externes
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';

// 3. Modules internes (@/)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 4. Types (import type obligatoire)
import type { User } from '@/types';
```

### Règles

- Toujours `@/` — jamais de chemins relatifs `../../`
- `import type { X }` pour les types purs (enforced par ESLint)
- `Logger` de `@/lib/logger` — jamais `console.log` (RGPD)

## 10. Anti-patterns interdits

| Anti-pattern                   | Pourquoi                           | Alternative                        |
| ------------------------------ | ---------------------------------- | ---------------------------------- |
| `style={{ color: 'red' }}`     | Bypass le design system            | `className="text-destructive"`     |
| `!important`                   | Casse la cascade Tailwind          | Utiliser `cn()` pour merge         |
| `className="bg-[#4f46e5]"`     | Valeur arbitraire, non maintenable | `bg-primary`                       |
| `<div onClick={}>`             | Non accessible au clavier          | `<button>`                         |
| Modifier `src/components/ui/*` | Casse les mises à jour shadcn      | Wrapper pattern                    |
| `npm install` / `yarn add`     | Lockfile incompatible              | `pnpm add` uniquement              |
| `console.log()`                | Fuite de données en prod           | `logger.debug()`                   |
| Ternaire inline dans className | Illisible, non mergeable           | `cn()` + conditions                |
| `p-[13px]`, `mt-[7px]`         | Hors échelle de spacing            | Utiliser l'échelle Tailwind        |
| Desktop-first responsive       | Incohérent avec le projet          | Mobile-first (`sm:`, `md:`, `lg:`) |

## 11. Checklist de code review

Avant chaque MR, vérifier :

### Design System

- [ ] Aucune couleur hardcodée (`bg-[#xxx]`, `text-blue-500`)
- [ ] Tokens sémantiques utilisés (`bg-primary`, `text-foreground`)
- [ ] `cn()` pour les classes conditionnelles
- [ ] CVA pour les variants de composants
- [ ] Composants shadcn/ui non modifiés directement

### Storybook

- [ ] Story créée pour tout nouveau composant visible
- [ ] `tags: ['autodocs']` présent
- [ ] ArgTypes définis pour les props principales
- [ ] Titre selon la convention (`Introduction`, `Foundations/`, `UI Components/`, `Shared Components/`, `Features/`, `Pages/`)

### Responsive et accessibilité

- [ ] Approche mobile-first
- [ ] Testé sur breakpoints `sm`, `md`, `lg`
- [ ] HTML sémantique (pas de `<div>` cliquables)
- [ ] `aria-label` sur les boutons icon-only
- [ ] Zéro violation a11y critique dans Storybook

### Qualité du code

- [ ] `pnpm lint` passe (zéro warning)
- [ ] `pnpm exec tsc --noEmit` passe
- [ ] `npx prettier --check` passe
- [ ] Pas de `any`, pas de `console.log`
- [ ] Imports triés et aliasés (`@/`)
