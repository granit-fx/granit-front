import { ProviderIcon } from './provider-icon';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ProviderIcon> = {
  title: 'Features/AiChat/ProviderIcon',
  component: ProviderIcon,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ProviderIcon>;

/** Branded glyphs keyed by the model provider (case-insensitive). */
const KNOWN_PROVIDERS: readonly string[] = [
  'openai',
  'anthropic',
  'gemini',
  'mistral',
  'grok',
  'deepseek',
  'qwen',
  'moonshot',
  'perplexity',
  'midjourney',
  'ollama',
];

/** A single branded provider icon. */
export const Single: Story = {
  args: { provider: 'anthropic', className: 'h-6 w-6 text-foreground' },
};

/** Unknown / custom provider falls back to a generic bot glyph. */
export const Fallback: Story = {
  args: { provider: 'acme-llm', className: 'h-6 w-6 text-muted-foreground' },
};

/** Gallery of every known provider. */
export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {KNOWN_PROVIDERS.map((provider) => (
        <div key={provider} className="flex items-center gap-3 text-foreground">
          <ProviderIcon provider={provider} className="h-6 w-6" />
          <span className="text-sm">{provider}</span>
        </div>
      ))}
    </div>
  ),
};
