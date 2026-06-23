import { ExternalProviderIcon } from './external-provider-icon';

import type { ExternalProviderType } from '@granit/account';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ExternalProviderIcon> = {
  title: 'Account/ExternalProviderIcon',
  component: ExternalProviderIcon,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ExternalProviderIcon>;

/** Branded glyphs keyed by the provider `type` advertised in the config. */
const KNOWN_TYPES: readonly ExternalProviderType[] = [
  'Google',
  'Microsoft',
  'Apple',
  'GitHub',
  'Facebook',
  'Oidc',
];

/** A single branded provider icon (keyed by `type`). */
export const Single: Story = {
  args: { provider: 'GitHub', className: 'h-6 w-6 text-foreground' },
};

/** Unknown / custom OIDC type falls back to a generic key glyph. */
export const Fallback: Story = {
  args: { provider: 'keycloak-corp', className: 'h-6 w-6 text-muted-foreground' },
};

/** Gallery of every known provider type. */
export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {KNOWN_TYPES.map((type) => (
        <div key={type} className="flex items-center gap-3 text-foreground">
          <ExternalProviderIcon provider={type} className="h-6 w-6" />
          <span className="text-sm">{type}</span>
        </div>
      ))}
    </div>
  ),
};
