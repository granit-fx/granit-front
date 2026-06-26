# @granit/react-icons

Granit's **data-driven icon primitive** — resolve a backend-stored icon identifier
string to a [lucide](https://lucide.dev) glyph, with a guaranteed fallback. This is a
framework primitive, not a domain feature kit: it holds no business logic, just the two
factories the rest of the framework builds icon pickers and renderers on top of.

The problem it solves: backends store icons as opaque strings (e.g. `"folder"`,
`"shield-check"`), and the UI must map them to React components. Reaching for
`lucide-react/dynamic` resolves every glyph at runtime and defeats tree-shaking (each
icon becomes its own chunk). `@granit/react-icons` instead resolves against an explicit,
package-owned set so the bundle ships only the icons actually referenced.

Two resolution strategies:

- **`createIconSet`** — a **bounded, package-owned** map. You hand it a literal record of
  `{ name: LucideIcon }` plus a `fallback` key, and it returns a typed `IconSet<TName>`
  whose `resolve(name)` always yields a glyph (unknown/`null` → the fallback) and whose
  `ids` enumerate the known names (e.g. to render a picker grid). Tree-shakes to exactly
  the glyphs you passed. Use it inside a `@granit/*` package that owns a fixed vocabulary.
- **`createIconRegistry`** — an **open, host-filled** registry. The framework ships the
  empty registry plus a fallback glyph; the consuming app `register`s its own
  `name → glyph` entries at startup (optionally a `setFallback` resolver). Its `resolve`
  returns `undefined` for unknown names, while the bundled `Icon` component renders the
  fallback for them. Use it when the icon vocabulary is decided by the app, not the
  framework.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not installed
standalone.

## Usage

```tsx
import { createIconSet, type IconProps } from '@granit/react-icons';
import { Folder, Shield, FileText } from 'lucide-react';

const documentIcons = createIconSet({
  folder: Folder,
  permission: Shield,
  file: FileText,
});

function DocumentIcon({ name, ...props }: { name: string } & IconProps) {
  const Glyph = documentIcons.resolve(name); // falls back when `name` is unknown
  return <Glyph {...props} />;
}
```

## Public API

- **`createIconSet(icons, { fallback })`** _(function)_ — build a bounded, typed icon set
  from a literal `{ name: glyph }` map; returns an `IconSet` with `resolve` and `ids`.
- **`createIconRegistry({ fallback })`** _(function)_ — build an open registry hosts fill
  at startup; returns an `IconRegistry` with `register`, `setFallback`, `resolve`, `Icon`.
- **`IconSet<TName>`** _(type)_ — `{ resolve(name): IconGlyph; ids: readonly TName[] }`.
- **`IconRegistry`** _(type)_ — `{ register; setFallback; resolve; Icon }`.
- **`IconGlyph`** _(type)_ — a renderable glyph component (alias of lucide's `LucideIcon`).
- **`IconProps`** _(type)_ — props forwarded to a rendered glyph (`name`, `className`, …).
