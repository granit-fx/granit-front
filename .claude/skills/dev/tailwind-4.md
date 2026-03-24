# Tailwind CSS 4.0 Reference

Tailwind CSS v4.0 (released January 2025) is a ground-up rewrite. Configuration moves
from JavaScript to CSS, the engine is dramatically faster, and many utilities are
renamed or restructured.

---

## Installation (Vite)

Use the first-party Vite plugin for best performance:

```bash
pnpm add tailwindcss @tailwindcss/vite
```

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

```css
/* src/styles.css */
@import 'tailwindcss';
```

No `postcss.config.js` needed with the Vite plugin.

---

## CSS-first configuration

### Before (v3) — JavaScript config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: { brand: '#3f3cbb' },
      fontFamily: { display: ['Satoshi', 'sans-serif'] },
    },
  },
};
```

### After (v4) — CSS `@theme` directive

```css
@import 'tailwindcss';

@theme {
  --font-display: 'Satoshi', 'sans-serif';
  --color-brand: #3f3cbb;
  --breakpoint-3xl: 120rem;
  --spacing: 0.25rem;
}
```

Legacy JS config still works (opt-in):

```css
@config "../../tailwind.config.js";
```

But `corePlugins`, `safelist`, and `separator` options are NOT supported in v4.

---

## Directives

### `@theme` — design tokens

Defines CSS variables that also generate utility classes. Namespace determines
which utilities are generated:

| Namespace         | Generates                                          |
| ----------------- | -------------------------------------------------- |
| `--color-*`       | `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*` |
| `--font-*`        | `font-sans`, `font-serif`, `font-display`          |
| `--text-*`        | `text-xl`, `text-base`, `text-sm`                  |
| `--font-weight-*` | `font-bold`, `font-semibold`                       |
| `--breakpoint-*`  | `sm:`, `md:`, `lg:`, `xl:`                         |
| `--container-*`   | `@sm:`, `@md:`, `@lg:` container queries           |
| `--spacing`       | All spacing/sizing utilities                       |
| `--radius-*`      | `rounded-sm`, `rounded-lg`                         |
| `--shadow-*`      | `shadow-md`, `shadow-xl`                           |
| `--blur-*`        | `blur-md`, `blur-xl`                               |
| `--ease-*`        | `ease-out`, `ease-in`                              |
| `--animate-*`     | `animate-spin`, `animate-bounce`                   |
| `--perspective-*` | `perspective-near`, `perspective-distant`          |
| `--aspect-*`      | `aspect-video`, `aspect-square`                    |

Override an entire namespace with `--*: initial`:

```css
@theme {
  --color-*: initial; /* Remove ALL default colors */
  --color-white: #fff;
  --color-brand: oklch(0.72 0.11 221.19);
}
```

**`inline` keyword** — when referencing other theme variables:

```css
@theme inline {
  --font-sans: var(--font-inter);
}
```

**`static` keyword** — generate CSS variables even if unused:

```css
@theme static {
  --color-primary: var(--color-red-500);
}
```

### `@utility` — custom utilities

Replaces `@layer utilities { }` and `@layer components { }`:

```css
/* v3 */
@layer utilities {
  .tab-4 {
    tab-size: 4;
  }
}
@layer components {
  .btn {
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
  }
}

/* v4 */
@utility tab-4 {
  tab-size: 4;
}
@utility btn {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ButtonFace;
}
```

Custom utilities automatically work with all variants (`hover:tab-4`, `lg:tab-4`).

### `@custom-variant` — custom variants

```css
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
```

Usage: `theme-midnight:bg-black theme-midnight:text-white`

### `@variant` — apply variant in CSS

```css
.my-element {
  background: white;
  @variant dark {
    background: black;
  }
}
```

### `@reference` — import without output (CSS Modules, Vue, Svelte)

```vue
<style>
@reference "../../app.css";
h1 {
  @apply text-2xl font-bold text-red-500;
}
</style>
```

### `@source` — explicit content sources

```css
@import 'tailwindcss';
@source "../node_modules/@my-company/ui-lib";
```

### `@source inline()` — safelisting (replaces `safelist`)

```css
@source inline(.custom-class-1, .custom-class-2);
```

---

## Breaking changes from v3

### Browser requirements

Requires **Safari 16.4+**, **Chrome 111+**, **Firefox 128+** (uses `@property`,
`color-mix()`, cascade layers).

### Entry point

```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import 'tailwindcss';
```

### Removed deprecated utilities

| Removed (v3)        | Replacement (v4)                 |
| ------------------- | -------------------------------- |
| `bg-opacity-*`      | `bg-black/50` (opacity modifier) |
| `text-opacity-*`    | `text-black/50`                  |
| `border-opacity-*`  | `border-black/50`                |
| `flex-shrink-*`     | `shrink-*`                       |
| `flex-grow-*`       | `grow-*`                         |
| `overflow-ellipsis` | `text-ellipsis`                  |
| `decoration-slice`  | `box-decoration-slice`           |
| `decoration-clone`  | `box-decoration-clone`           |

### Renamed scale utilities

The bare/unsized versions shift down one step; a new `-xs` is introduced:

| v3               | v4               |
| ---------------- | ---------------- |
| `shadow-sm`      | `shadow-xs`      |
| `shadow`         | `shadow-sm`      |
| `rounded-sm`     | `rounded-xs`     |
| `rounded`        | `rounded-sm`     |
| `blur-sm`        | `blur-xs`        |
| `blur`           | `blur-sm`        |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow`    | `drop-shadow-sm` |

### Gradient rename

```html
<!-- v3 -->
<div class="bg-gradient-to-r from-blue-500 to-teal-400"></div>

<!-- v4 -->
<div class="bg-linear-to-r from-blue-500 to-teal-400"></div>
```

### Default value changes

| Property               | v3 default | v4 default                  |
| ---------------------- | ---------- | --------------------------- |
| Border color           | `gray-200` | `currentColor`              |
| Ring width             | 3px        | 1px                         |
| Ring color             | `blue-500` | `currentColor`              |
| Placeholder color      | `gray-400` | current text at 50% opacity |
| Button cursor          | `pointer`  | `default` (browser default) |
| Outline `outline-none` | removed    | renamed to `outline-hidden` |

### Variant stacking order reversed

Variants now apply **left to right** (v3 was right to left):

```html
<!-- v3 -->
<ul class="first:*:pt-0 last:*:pb-0">
  <!-- v4 -->
  <ul class="*:first:pt-0 *:last:pb-0"></ul>
</ul>
```

### Arbitrary value syntax change for CSS variables

```html
<!-- v3 -->
<div class="bg-[--brand-color]"></div>

<!-- v4: use parentheses -->
<div class="bg-(--brand-color)"></div>
```

### `hover:` respects device capability

`hover:` now generates `@media (hover: hover)` — touch-only devices excluded.
Override with:

```css
@custom-variant hover (&:hover);
```

### `[hidden]` priority

`[hidden]` now takes priority over display utility classes.

### Removed features

- `corePlugins` option
- `safelist` option (use `@source inline()`)
- `separator` option
- `resolveConfig()` JS function (use `getComputedStyle` for CSS variables)
- Sass/Less/Stylus **not compatible** with v4

---

## New features

### Automatic content detection

No `content` array needed. Tailwind scans template files, respects `.gitignore`,
ignores binary files. Use `@source` to include additional paths.

### Dynamic utility values

Any number works without configuration:

```html
<div class="grid grid-cols-15"></div>
<div class="mt-17"></div>
<div class="w-29"></div>
```

### Container queries (built-in)

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">
    <!-- Responsive to container size -->
  </div>
</div>

<!-- Max-width container queries -->
<div class="@container">
  <div class="grid grid-cols-3 @max-md:grid-cols-1"></div>
</div>

<!-- Range queries -->
<div class="@container">
  <div class="flex @min-md:@max-xl:hidden"></div>
</div>
```

### 3D transforms

```html
<div class="perspective-distant">
  <article class="rotate-x-51 rotate-z-43 transform-3d"></article>
</div>
```

Utilities: `rotate-x-*`, `rotate-y-*`, `rotate-z-*`, `scale-z-*`, `translate-z-*`,
`perspective-*`, `perspective-origin-*`, `transform-3d`.

### Expanded gradient API

```html
<!-- Angled linear gradient -->
<div class="bg-linear-45 from-indigo-500 via-purple-500 to-pink-500"></div>

<!-- Color interpolation -->
<div class="bg-linear-to-r/oklch from-indigo-500 to-teal-400"></div>

<!-- Conic gradient -->
<div class="bg-conic/[in_hsl_longer_hue] from-red-600 to-red-600"></div>

<!-- Radial gradient -->
<div class="bg-radial-[at_25%_25%] from-white to-zinc-900 to-75%"></div>
```

### `@starting-style` (entry animations without JS)

```html
<div popover id="my-popover" class="transition-discrete starting:open:opacity-0"></div>
```

### `not-*` variant

```html
<div class="not-hover:opacity-75"></div>
<div class="not-supports-hanging-punctuation:px-4"></div>
```

### Inset shadows (stackable)

```html
<div class="inset-shadow-sm inset-shadow-md inset-ring-1"></div>
```

### `field-sizing-content` (auto-resize textarea)

```html
<textarea class="field-sizing-content"></textarea>
```

### `nth-*` variants

```html
<div class="nth-3:font-bold nth-odd:bg-gray-100"></div>
```

### `in-*` variant (group-like, no group class needed)

```html
<div class="in-[.parent]:text-lg"></div>
```

### `descendants:` variant

```html
<div class="descendants:text-gray-600"></div>
```

### `inert:` variant

```html
<div inert class="inert:opacity-50"></div>
```

### Font stretch (variable fonts)

```html
<div class="font-stretch-condensed"></div>
```

### Color scheme

```html
<div class="color-scheme-dark"></div>
```

---

## Color system — OKLCH / P3

The entire palette uses **OKLCH** in the **P3 color space**:

```css
/* v3 (sRGB) */
--color-red-500: #ef4444;

/* v4 (OKLCH / P3) */
--color-red-500: oklch(0.704 0.191 22.216);
```

Opacity modifiers use `color-mix()` in `oklab` space:

```css
.bg-blue-500\/50 {
  background-color: color-mix(in oklab, var(--color-blue-500) 50%, transparent);
}
```

---

## Performance

Benchmarked on Catalyst UI kit:

| Metric                   | v3.4  | v4.0  | Improvement |
| ------------------------ | ----- | ----- | ----------- |
| Full build               | 378ms | 100ms | **3.78x**   |
| Incremental (new CSS)    | 44ms  | 5ms   | **8.8x**    |
| Incremental (no new CSS) | 35ms  | 192us | **182x**    |

---

## Sharing themes in monorepo

```css
/* packages/brand/theme.css */
@theme {
  --*: initial;
  --spacing: 4px;
  --color-brand: oklch(0.72 0.11 221.19);
}

/* packages/admin/app.css */
@import 'tailwindcss';
@import '../brand/theme.css';
```

---

## Accessing theme in JavaScript

```typescript
const styles = getComputedStyle(document.documentElement);
const shadow = styles.getPropertyValue('--shadow-xl');
const color = styles.getPropertyValue('--color-blue-500');
```

---

## Prefix syntax

```css
@import 'tailwindcss' prefix(tw);
```

Usage: `tw:flex tw:bg-red-500`. CSS variables become `--tw-color-*`, `--tw-font-*`.

---

## Migration from v3

### Automated upgrade tool

```bash
npx @tailwindcss/upgrade
```

Requires Node.js 20+. Run in a new branch and review the diff.

### Manual PostCSS migration

```javascript
// Before
export default {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

// After
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Remove `postcss-import` (built-in) and `autoprefixer` (built-in).
