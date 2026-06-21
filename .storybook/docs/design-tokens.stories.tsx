import type { Meta, StoryObj } from '@storybook/react-vite';

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

// Color swatch component
function ColorSwatch({ name, variable, hex }: { name: string; variable: string; hex: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-lg border border-slate-200 flex-shrink-0"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500 font-mono">{variable}</p>
        <p className="text-xs text-slate-400 font-mono">{hex}</p>
      </div>
    </div>
  );
}

const adminColors = [
  { name: 'Admin 50', variable: '--color-admin-50', hex: '#eef2ff' },
  { name: 'Admin 100', variable: '--color-admin-100', hex: '#e0e7ff' },
  { name: 'Admin 200', variable: '--color-admin-200', hex: '#c7d2fe' },
  { name: 'Admin 300', variable: '--color-admin-300', hex: '#a5b4fc' },
  { name: 'Admin 500', variable: '--color-admin-500', hex: '#6366f1' },
  { name: 'Admin 600 (Primary)', variable: '--color-admin-600', hex: '#4f46e5' },
  { name: 'Admin 700', variable: '--color-admin-700', hex: '#4338ca' },
  { name: 'Admin 900', variable: '--color-admin-900', hex: '#1e1b4b' },
];

const semanticColors = [
  { name: 'Primary (Indigo 600)', variable: '--color-primary', hex: '#4f46e5' },
  { name: 'Success 600', variable: '--color-success-600', hex: '#16a34a' },
  { name: 'Warning 600', variable: '--color-warning-600', hex: '#d97706' },
  { name: 'Alert 600', variable: '--color-alert-600', hex: '#dc2626' },
];

const slateColors = [
  { name: 'Slate 50', variable: '--color-slate-50', hex: '#f8fafc' },
  { name: 'Slate 100', variable: '--color-slate-100', hex: '#f1f5f9' },
  { name: 'Slate 200', variable: '--color-slate-200', hex: '#e2e8f0' },
  { name: 'Slate 500', variable: '--color-slate-500', hex: '#64748b' },
  { name: 'Slate 700', variable: '--color-slate-700', hex: '#334155' },
  { name: 'Slate 900', variable: '--color-slate-900', hex: '#0f172a' },
];

export const ColorPalette: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="mx-auto max-w-4xl space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Design Tokens</h1>
          <p className="mt-1 text-slate-500">Palette de couleurs — Granit Showcase Design System</p>
        </div>

        {/* Admin Palette */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Palette Admin (Indigo)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {adminColors.map((color) => (
              <ColorSwatch key={color.variable} {...color} />
            ))}
          </div>
        </section>

        {/* Semantic Colors */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Couleurs sémantiques
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {semanticColors.map((color) => (
              <ColorSwatch key={color.variable} {...color} />
            ))}
          </div>
        </section>

        {/* Slate Neutrals */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Neutres (Slate)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {slateColors.map((color) => (
              <ColorSwatch key={color.variable} {...color} />
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Typographie — Inter
          </h2>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
            <div className="text-3xl font-bold text-slate-900">Heading 3XL — Bold 700</div>
            <div className="text-2xl font-semibold text-slate-900">Heading 2XL — Semibold 600</div>
            <div className="text-xl font-semibold text-slate-900">Heading XL — Semibold 600</div>
            <div className="text-lg font-medium text-slate-900">Heading LG — Medium 500</div>
            <div className="text-base text-slate-700">Body Base — Regular 400</div>
            <div className="text-sm text-slate-600">Body SM — Regular 400</div>
            <div className="text-xs text-slate-500">Body XS — Regular 400</div>
            <div className="font-mono text-sm text-slate-700">
              Mono — granit-showcase-admin · role · flag.key
            </div>
          </div>
        </section>

        {/* Status Badges */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Statuts système
          </h2>
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
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
              Disabled
            </span>
          </div>
        </section>
      </div>
    </div>
  ),
};
