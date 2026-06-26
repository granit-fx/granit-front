import { COLOR_THEME_CATALOG } from '@granit/ui-theme';
import { UI_THEMES_CATALOG } from '@granit/ui-themes';
import { useEffect, useRef, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode, RefObject } from 'react';

const meta: Meta = {
  title: 'Foundations/Design Tokens',
  tags: ['!test'],
  parameters: {
    layout: 'fullscreen',
    docs: { page: null },
  },
};

export default meta;
type Story = StoryObj;

// Live-read a computed style property, re-reading whenever the theme/mode changes.
// The toolbar sets `class`/`data-theme` on <html> in a *parent* effect, which runs
// after child effects — so a plain useEffect read is one change stale. Observing
// the <html> attributes instead reads after they actually change (no F5 needed).
function useComputedStyle(ref: RefObject<Element | null>, property: string): string {
  const [value, setValue] = useState('');
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const read = () => setValue(getComputedStyle(element).getPropertyValue(property));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, [ref, property]);
  return value;
}

/**
 * A single colour token, painted from its CSS variable (raw shadcn vars like
 * `--primary` for the themeable set, `--color-admin-600` for the fixed scales),
 * so it reflects the live value for the active mode and theme. The resolved
 * value is read back with getComputedStyle for reference.
 */
function TokenSwatch({ cssVar }: { cssVar: string }) {
  const name = cssVar.replace(/^--(color-)?/, '');
  const ref = useRef<HTMLDivElement>(null);
  const resolved = useComputedStyle(ref, 'background-color');
  return (
    <div className="flex items-center gap-3">
      <div
        ref={ref}
        className="h-10 w-10 flex-shrink-0 rounded-lg border border-border"
        style={{ backgroundColor: `var(${cssVar})` }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{cssVar}</p>
        <p className="font-mono text-xs text-muted-foreground/70">{resolved}</p>
      </div>
    </div>
  );
}

function ShadowSwatch({ token }: { token: string }) {
  const cssVar = `--shadow-${token}`;
  return (
    <div className="space-y-2">
      <div
        className="h-16 rounded-lg border border-border bg-card"
        style={{ boxShadow: `var(${cssVar})` }}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-foreground">{token}</p>
      <p className="font-mono text-xs text-muted-foreground">{cssVar}</p>
    </div>
  );
}

// Literal `rounded-*` classes so Tailwind scans them and emits the matching
// `--radius-*` theme vars (a bare `var(--radius-3xl)` would be tree-shaken away
// when no `rounded-3xl` utility appears in source — leaving a square box).
const RADIUS_CLASS: Record<string, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  '4xl': 'rounded-4xl',
};

function RadiusSwatch({ step }: { step: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const resolved = useComputedStyle(ref, 'border-top-left-radius');
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        className={`h-16 w-16 border-2 border-primary bg-accent ${RADIUS_CLASS[step]}`}
        aria-hidden="true"
      />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{step}</p>
        <p className="font-mono text-xs text-muted-foreground">{resolved}</p>
      </div>
    </div>
  );
}

// Renders a sample in `var(--font-…)` and labels it with the LIVE resolved
// family (read back via getComputedStyle) — so it shows the active theme's font
// (Inter, Antic, …) instead of a hard-coded name.
function FontSample({ cssVar, sample }: { cssVar: string; sample: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const resolved = useComputedStyle(ref, 'font-family');
  return (
    <div>
      <p className="font-mono text-xs text-muted-foreground">
        {cssVar} → {resolved}
      </p>
      <p
        ref={ref}
        className="text-xl text-card-foreground"
        style={{ fontFamily: `var(${cssVar})` }}
      >
        {sample}
      </p>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">{title}</h2>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SwatchGrid({ vars }: { vars: readonly string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {vars.map((v) => (
        <TokenSwatch key={v} cssVar={v} />
      ))}
    </div>
  );
}

// shadcn/ui semantic tokens — raw vars (--x); flip with mode (.dark) and theme.
const SEMANTIC_TOKENS = [
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'muted',
  'muted-foreground',
  'destructive',
  'destructive-foreground',
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'border',
  'input',
  'ring',
].map((t) => `--${t}`);

// Sidebar tokens — raw vars; neutrals plus primary/ring that follow the theme.
const SIDEBAR_TOKENS = [
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
].map((t) => `--${t}`);

// Semantic status tokens — raw vars; flip light(-600)/dark(-500) like primary.
const STATUS_TOKENS = [
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'alert',
  'alert-foreground',
].map((t) => `--${t}`);

// Categorical chart series — raw vars; flip in dark for legibility.
const CHART_TOKENS = [1, 2, 3, 4, 5].map((n) => `--chart-${n}`);

// Fixed scales (@theme static) — --color-* utilities, independent of mode/theme.
const ADMIN_SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
  (n) => `--color-admin-${n}`
);
const ALERT_SCALE = [50, 100, 500, 600, 700].map((n) => `--color-alert-${n}`);
const SUCCESS_SCALE = [50, 100, 500, 600].map((n) => `--color-success-${n}`);
const WARNING_SCALE = [50, 100, 500, 600].map((n) => `--color-warning-${n}`);

// The whole catalogue shown in Storybook: base accent themes (@granit/ui-theme)
// plus opt-in full themes (@granit/ui-themes). A real app offers only a subset.
const THEME_CATALOG = [...COLOR_THEME_CATALOG, ...UI_THEMES_CATALOG];

// Live preview of one selectable theme. The `data-theme` attribute is the exact
// runtime contract (set on <html> by the colour-theme store); the block resolves
// the tokens from CSS, so the preview can never drift from what an app renders.
// Light/dark follows the global Storybook toolbar.
function ThemePreview({ id, label }: { id: string; label: string }) {
  return (
    <div data-theme={id} className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">data-theme=&quot;{id}&quot;</span>
      </div>
      <div className="space-y-2 p-4">
        <button
          type="button"
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Primary
        </button>
        <div className="flex gap-2">
          <span className="rounded-md bg-card px-2 py-1 text-xs text-card-foreground border">
            card
          </span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">muted</span>
          <span className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
            accent
          </span>
        </div>
      </div>
    </div>
  );
}

export const ColorThemes: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Color Themes</h1>
          <p className="mt-1 text-muted-foreground">
            Le catalogue complet : {COLOR_THEME_CATALOG.length} thèmes d&apos;accent (
            <code className="font-mono">@granit/ui-theme</code>) + {UI_THEMES_CATALOG.length}{' '}
            thème(s) complet(s) (<code className="font-mono">@granit/ui-themes</code>). Chacun est
            un bloc <code className="font-mono">[data-theme]</code> (clair + sombre) ; une app
            n&apos;en offre qu&apos;un sous-ensemble.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {THEME_CATALOG.map(({ id, label }) => (
            <ThemePreview key={id} id={id} label={label} />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const ColorPalette: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <div className="mx-auto max-w-4xl space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design Tokens</h1>
          <p className="mt-1 text-muted-foreground">
            Tous les tokens de <code className="font-mono">@granit/ui-theme/base.css</code>. Les
            pastilles sont lues en direct depuis <code className="font-mono">var(--color-…)</code> —
            elles suivent le mode (toolbar clair/sombre) et la palette active.
          </p>
        </div>

        <Section
          title="Tokens sémantiques (shadcn/ui)"
          hint="Basculent avec le mode et la palette — c'est le contrat consommé par tous les composants @granit/react-*."
        >
          <SwatchGrid vars={SEMANTIC_TOKENS} />
        </Section>

        <Section
          title="Sidebar"
          hint="Exposés via @theme inline. sidebar-primary / sidebar-ring suivent la palette active ; le reste est neutre par mode."
        >
          <SwatchGrid vars={SIDEBAR_TOKENS} />
        </Section>

        <Section
          title="Statut (sémantique)"
          hint="success / warning / alert — basculent light(-600)/dark(-500). Remplacent le pattern text-success-600 dark:text-success-500 dans les composants."
        >
          <SwatchGrid vars={STATUS_TOKENS} />
        </Section>

        <Section
          title="Charts"
          hint="Séries catégorielles (parité shadcn). Variantes plus vives en dark."
        >
          <SwatchGrid vars={CHART_TOKENS} />
        </Section>

        <Section
          title="Accent — Admin (Blue)"
          hint="Échelle fixe (@theme). Indépendante du mode et de la palette — n'utilisez ces nuances que pour des accents qui ne doivent pas suivre le thème."
        >
          <SwatchGrid vars={ADMIN_SCALE} />
        </Section>

        <Section title="Statut — Alert (Red)">
          <SwatchGrid vars={ALERT_SCALE} />
        </Section>

        <Section title="Statut — Success (Emerald)">
          <SwatchGrid vars={SUCCESS_SCALE} />
        </Section>

        <Section title="Statut — Warning (Amber)">
          <SwatchGrid vars={WARNING_SCALE} />
        </Section>

        <Section title="Typographie">
          <div className="space-y-5 rounded-lg border border-border bg-card p-6">
            <FontSample cssVar="--font-sans" sample="The quick brown fox jumps · 0123456789" />
            <FontSample cssVar="--font-serif" sample="The quick brown fox jumps · 0123456789" />
            <FontSample cssVar="--font-mono" sample="const flag = 'role.key';" />
            <div className="space-y-2 border-t border-border pt-4">
              <div className="text-3xl font-bold text-card-foreground">Heading 3XL — Bold 700</div>
              <div className="text-2xl font-semibold text-card-foreground">
                Heading 2XL — Semibold 600
              </div>
              <div className="text-lg font-medium text-card-foreground">
                Heading LG — Medium 500
              </div>
              <div className="text-base text-card-foreground">Body Base — Regular 400</div>
              <div className="text-sm text-muted-foreground">Body SM — Regular 400</div>
            </div>
          </div>
        </Section>

        <Section title="Ombres">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ShadowSwatch token="card" />
            <ShadowSwatch token="card-hover" />
            <ShadowSwatch token="header" />
          </div>
        </Section>

        <Section
          title="Rayon"
          hint="Échelle dérivée de --radius (0.5rem) : rounded-sm/md/lg/xl/2xl/3xl/4xl. Re-thémer --radius rescale toute l'échelle."
        >
          <div className="flex flex-wrap items-start gap-6">
            {['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'].map((step) => (
              <RadiusSwatch key={step} step={step} />
            ))}
          </div>
        </Section>

        <Section
          title="Statuts système"
          hint="Exemple d'usage : badges construits sur les palettes de statut + accent."
        >
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-success-500/25 bg-success-500/15 px-3 py-1 text-sm font-medium text-success-600 dark:text-success-500">
              Healthy
            </span>
            <span className="rounded-full border border-warning-500/25 bg-warning-500/15 px-3 py-1 text-sm font-medium text-warning-600 dark:text-warning-500">
              Degraded
            </span>
            <span className="rounded-full border border-alert-500/25 bg-alert-500/15 px-3 py-1 text-sm font-medium text-alert-600 dark:text-alert-500">
              Down
            </span>
            <span className="rounded-full border border-admin-200 bg-admin-50 px-3 py-1 text-sm font-medium text-admin-700">
              granit-showcase-admin
            </span>
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              Disabled
            </span>
          </div>
        </Section>
      </div>
    </div>
  ),
};
