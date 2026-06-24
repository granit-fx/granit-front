# Data-driven icons — backend-stored icon names → glyphs

This document describes how Granit renders an icon whose identity is **data, not
code**: the backend stores an icon *identifier string* (a workspace's icon, a
prompt's glyph, a CMS icon block) and the front resolves it to a rendered glyph.
An icon is often more legible than a label, so this pattern recurs across admin
domains — this is the one way to do it.

The mechanism lives in **`@granit/react-icons`**; each domain declares its own
vocabulary on top of it.

The guiding rule:

> Share the **mechanism** (resolve a name → glyph, with a fallback). Keep the
> **vocabulary** (which names map to which glyphs) in the domain that owns it.
> A single global icon registry would couple unrelated domains and force one
> ownership model onto three different ones.

---

## Why not `lucide-react/dynamic`

The obvious approach — `lucide-react/dynamic`'s `DynamicIcon`, which renders any
lucide icon by name — pulls in `dynamicIconImports`, a map of ~1762 lazy
`import('./icons/*.js')`. The bundler emits **one chunk per icon** (~1953 files
/ +7 MB in a showcase build) regardless of how few you use. At runtime only the
rendered icons load, so it is not a runtime problem, but the dist explosion is
real and the dependency is heavy.

`@granit/react-icons` resolves names against **statically imported** glyphs
instead, so the bundler tree-shakes to only the icons actually referenced — no
per-icon chunks, no `lucide-react/dynamic` in the graph.

---

## The two shapes — bounded vs open

Everything turns on **who controls the vocabulary**.

| Shape       | Vocabulary owner                        | Factory                | Host registers? |
| ----------- | --------------------------------------- | ---------------------- | --------------- |
| **Bounded** | the package (a picker / a backend enum) | `createIconSet`        | no              |
| **Open**    | the backend (free assignment)           | `createIconRegistry`   | yes             |

> **Decision rule.** The front constrains what is selectable (a picker, or a map
> mirroring a backend enum) → **bounded**, `createIconSet` in the package. The
> backend assigns icon names freely and the package cannot enumerate them at
> build time → **open**, `createIconRegistry` filled by the host.

### Bounded — `createIconSet`

The package ships a curated map plus a default. A stored identifier is always
one of the keys (a picker or a backend enum guarantees it), so the package
resolves it with no host involvement.

```ts
import { createIconSet } from '@granit/react-icons';
import { Sparkles, Calendar, Mail /* … */ } from 'lucide-react';

const PROMPT_ICONS = { sparkles: Sparkles, calendar: Calendar, mail: Mail /* … */ };

const promptIcons = createIconSet(PROMPT_ICONS, { fallback: 'sparkles' });

export const getPromptIcon = promptIcons.resolve; // (name) => glyph, default for unknown
export const PROMPT_ICON_IDS = promptIcons.ids;    // for the picker grid
```

### Open — `createIconRegistry`

The package creates an empty registry with a fallback glyph and exposes its
`register` so the **host** can fill it with exactly the vocabulary its backend
emits, using static lucide imports (tree-shaken).

```ts
// in the package (e.g. @granit/react-ui-shell-admin)
import { createIconRegistry } from '@granit/react-icons';
import { Square } from 'lucide-react';

const workspaceIcons = createIconRegistry({ fallback: Square });

export const registerWorkspaceIcons = workspaceIcons.register;
export const setWorkspaceIconFallback = workspaceIcons.setFallback;
export const WorkspaceIcon = workspaceIcons.Icon; // <WorkspaceIcon name={…} />, fallback + error boundary
```

```ts
// in the host (e.g. granit-showcase-react/src/components/layout/workspace-icons.ts)
import { registerWorkspaceIcons } from '@granit/react-ui-shell-admin';
import { Activity, Bell, Shield /* … */ } from 'lucide-react';

registerWorkspaceIcons({ activity: Activity, bell: Bell, shield: Shield /* … */ });
```

The host imports that module for its side effect once at boot (`main.tsx`). A
name with no registered glyph renders the fallback (`Square`); add it to the host
map to fix it.

---

## The three cases today

| Domain     | Package                        | Shape   | Vocabulary bounded by                             |
| ---------- | ------------------------------ | ------- | ------------------------------------------------- |
| Workspaces | `@granit/react-ui-shell-admin` | open    | nothing (backend `WorkspaceDefinition.Icon(...)`) |
| Prompts    | `@granit/react-ai-prompts`     | bounded | a front `IconPicker` (16 glyphs)                  |
| CMS block  | `@granit/react-cms`            | bounded | the C# `IconName` enum                            |

Only **workspaces** is open, so it is the only one the host registers — the host
file holds exactly one `register*` call. Prompts and CMS are self-contained in
their packages.

---

## What the host does (and does not)

> The host registers icons **only for open registries**. Bounded sets are
> self-sufficient inside their package.

So a host has one `register*` call per open registry it consumes — today just
`registerWorkspaceIcons`. A second open domain (e.g. notification-type icons
assigned in the backend) would add its own `registerNotificationIcons`, with its
own fallback; bounded domains never appear in host wiring.

---

## Where the primitive lives, and why

`@granit/react-icons` is a deliberate **leaf** package — its only peers are
`react` and `lucide-react` (~1.4 KB built). It is **not** part of
`@granit/react-ui`: domain packages that consume the primitive
(`@granit/react-cms`, `@granit/react-ai-prompts`) are independently extractable,
so they should take a tiny icon peer rather than depend on the whole shadcn UI
kit just to resolve an icon string.

```text
@granit/react-icons        createIconSet · createIconRegistry · IconGlyph   (leaf)
   ▲           ▲        ▲
shell-admin   cms      ai-prompts        each builds its own set/registry on top
```

---

## Naming

- `createIconSet` / `createIconRegistry` — the generic, shared **mechanism**.
- `registerWorkspaceIcons`, `getPromptIcon`, … — a **specific instance** of that
  mechanism, named for the domain it serves. The `Workspace` / `Prompt` prefix
  identifies the instance, not leftover naming debt.

A generic `registerIcons` would wrongly imply a single global registry — the
anti-pattern this design rejects. Rename an instance only if its scope genuinely
widens (e.g. the shell registry starts serving non-workspace icons →
`registerShellIcons`).

---

## Adding a new data-driven-icon domain

1. Decide the shape with the **decision rule** above.
2. **Bounded** → `createIconSet(map, { fallback })` in your package; expose
   `resolve` (and `ids` if you need a picker). Constrain authoring to the keys
   (a picker, or a map mirroring the backend enum).
3. **Open** → `createIconRegistry({ fallback })` in your package; export its
   `register`/`Icon`. The host calls `register*` with its vocabulary (static
   lucide imports) at boot.
4. Never reach for `lucide-react/dynamic`. If an open domain truly cannot
   enumerate its icons, the host can wire `setFallback` to its **own**
   `DynamicIcon` wrapper — the dynamic dependency then lives host-side, not in
   the framework package.

---

## Related

- `docs/frontend-foundation-architecture.md` — the foundation package layers.
- `docs/design-system-rules.md` — tokens, components, semantic-only styling, a11y.
