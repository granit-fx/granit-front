import { Bot, Brain, Eye, FileText, LifeBuoy, Sparkles, Wrench } from 'lucide-react';

import { ProviderIcon } from '../components/provider-icon';

import type { WorkspaceOption } from '@granit/react-ai-chat';
import type { useTranslation } from '@granit/react-localization';
import type { ReactNode } from 'react';

/** The `t` returned by `useTranslation`; the catalog only needs key → string. */
type TranslateFn = ReturnType<typeof useTranslation>['t'];

/**
 * A model capability surfaced as a trailing glyph in the workspace picker.
 * Illustrative for the demo — a real deployment would derive these from the
 * backend's per-workspace model metadata rather than a static catalog.
 */
type Capability = 'tools' | 'vision' | 'reasoning' | 'documents';

type ModelMeta = {
  readonly label?: string;
  readonly icon: ReactNode;
  readonly group?: string;
  readonly capabilities?: readonly Capability[];
};

/**
 * Maps a backend workspace name to its display metadata. Matched by substring so
 * model-named workspaces (`deepseek-v3.2`, `qwen3-14b`, …) are decorated in a
 * real BFF, while the mock/demo workspaces (`Auto`, `general-chat`,
 * `document-extraction`, `indexing-embeddings`, `support`) get sensible
 * demo entries. Unknown workspaces fall back to a generic mark (see
 * {@link buildWorkspaceOptions}). Vendor entries use {@link ProviderIcon} brand
 * glyphs; functional buckets (`Auto`, extraction, support) keep generic lucide
 * marks.
 */
type RegistryEntry = {
  readonly match: RegExp;
  readonly meta: ModelMeta;
  /**
   * When set, this workspace-name entry wins even if the workspace's actual model
   * resolves to a different brand. Reserved for providers the model id can't
   * reveal — e.g. Azure OpenAI serves GPT models, so `gpt-4o` alone would
   * mis-attribute the `translation` workspace to plain OpenAI.
   */
  readonly override?: boolean;
};

const REGISTRY: readonly RegistryEntry[] = [
  {
    match: /^auto$/i,
    meta: { icon: <Sparkles className="size-4" /> },
  },
  // --- Demo workspace names (from mockWorkspaces) ---
  {
    match: /^default$/i,
    meta: {
      group: 'OpenAI',
      icon: <ProviderIcon provider="openai" className="size-4" />,
      capabilities: ['tools', 'vision'],
    },
  },
  {
    match: /^code-review$/i,
    meta: {
      group: 'OpenAI',
      icon: <ProviderIcon provider="openai" className="size-4" />,
      capabilities: ['tools'],
    },
  },
  {
    match: /^translation$/i,
    // Pinned: the model id (a GPT) can't reveal that this is Azure OpenAI.
    override: true,
    meta: {
      // Azure OpenAI serves OpenAI models — reuse the OpenAI mark.
      group: 'Azure OpenAI',
      icon: <ProviderIcon provider="openai" className="size-4" />,
      capabilities: ['vision'],
    },
  },
  // --- Generic name-based patterns for model-named workspaces ---
  {
    match: /general.chat/i,
    meta: { icon: <Bot className="size-4" />, capabilities: ['tools', 'vision'] },
  },
  {
    match: /document.extract/i,
    meta: { icon: <FileText className="size-4" />, capabilities: ['documents'] },
  },
  {
    match: /indexing|embedding/i,
    meta: { icon: <FileText className="size-4" />, capabilities: ['documents'] },
  },
  {
    match: /support/i,
    meta: { icon: <LifeBuoy className="size-4" />, capabilities: ['tools', 'documents'] },
  },
  {
    match: /deepseek/i,
    meta: {
      group: 'DeepSeek',
      icon: <ProviderIcon provider="deepseek" className="size-4" />,
      capabilities: ['tools', 'reasoning'],
    },
  },
  {
    match: /qwen/i,
    meta: {
      group: 'Alibaba',
      icon: <ProviderIcon provider="qwen" className="size-4" />,
      capabilities: ['tools', 'vision'],
    },
  },
  {
    match: /kimi/i,
    meta: {
      group: 'Moonshot',
      icon: <ProviderIcon provider="moonshot" className="size-4" />,
      capabilities: ['tools', 'documents'],
    },
  },
  {
    match: /mistral/i,
    meta: {
      group: 'Mistral AI',
      icon: <ProviderIcon provider="mistral" className="size-4" />,
      capabilities: ['tools', 'vision'],
    },
  },
  {
    match: /gemini/i,
    meta: {
      group: 'Google',
      icon: <ProviderIcon provider="gemini" className="size-4" />,
      capabilities: ['tools', 'vision', 'reasoning'],
    },
  },
  {
    match: /grok/i,
    meta: {
      group: 'xAI',
      icon: <ProviderIcon provider="grok" className="size-4" />,
      capabilities: ['tools', 'vision', 'reasoning'],
    },
  },
  {
    match: /perplexity|sonar/i,
    meta: {
      group: 'Perplexity',
      icon: <ProviderIcon provider="perplexity" className="size-4" />,
      capabilities: ['tools', 'documents'],
    },
  },
  {
    match: /midjourney/i,
    meta: {
      group: 'Midjourney',
      icon: <ProviderIcon provider="midjourney" className="size-4" />,
      capabilities: ['vision'],
    },
  },
  {
    match: /ollama/i,
    meta: {
      group: 'Ollama',
      icon: <ProviderIcon provider="ollama" className="size-4" />,
      capabilities: ['tools'],
    },
  },
  {
    match: /gpt|openai/i,
    meta: {
      group: 'OpenAI',
      icon: <ProviderIcon provider="openai" className="size-4" />,
      capabilities: ['tools', 'vision', 'reasoning'],
    },
  },
  {
    match: /claude/i,
    meta: {
      group: 'Anthropic',
      icon: <ProviderIcon provider="anthropic" className="size-4" />,
      capabilities: ['tools', 'vision', 'reasoning'],
    },
  },
];

/** English fallbacks so the glyph always has an accessible name, even before a
 *  culture's `AiChat.Capability.*` keys are synced from the backend. */
const CAPABILITY_FALLBACK: Record<Capability, string> = {
  tools: 'Uses tools',
  vision: 'Understands images',
  reasoning: 'Advanced reasoning',
  documents: 'Reads documents',
};

/** A localized, accessible glyph for one capability. */
function capabilityGlyph(capability: Capability, t: TranslateFn): ReactNode {
  const key = `AiChat.Capability.${capability.charAt(0).toUpperCase()}${capability.slice(1)}`;
  const label = t(key, CAPABILITY_FALLBACK[capability]);
  const className = 'size-3.5';
  const props = { className, role: 'img' as const, 'aria-label': label };
  switch (capability) {
    case 'tools':
      return <Wrench {...props} />;
    case 'vision':
      return <Eye {...props} />;
    case 'reasoning':
      return <Brain {...props} />;
    case 'documents':
      return <FileText {...props} />;
  }
}

/**
 * Turn the backend's flat workspace names into rich {@link WorkspaceOption}s
 * (leading model mark, capability glyphs, provider grouping) for the composer's
 * model picker. Workspaces not in the {@link REGISTRY} render with a generic
 * mark under the "Available" group, so the list never breaks on unknown values.
 *
 * @param modelNameByKey - Optional map of workspace key → its display label
 *   (`AIWorkspaceResponse.displayName`, e.g. `GPT-4o`). Drives the picker
 *   label and, when set, is also a brand-matching hint. Null/absent → the label
 *   falls back to the workspace name (never the raw model id).
 * @param modelByKey - Optional map of workspace key → the raw model id it runs
 *   (`AIWorkspaceResponse.model`, e.g. `deepseek-r1:7b`). Used only for brand-icon
 *   matching, so a `general-chat` workspace on DeepSeek gets the DeepSeek mark
 *   instead of a generic bot — without leaking the raw id into the label.
 */
export function buildWorkspaceOptions(
  workspaces: readonly string[],
  t: TranslateFn,
  modelNameByKey: Readonly<Record<string, string | null>> = {},
  modelByKey: Readonly<Record<string, string | null>> = {}
): readonly WorkspaceOption[] {
  return workspaces.map((value) => {
    const modelLabel = modelNameByKey[value];
    const nameEntry = REGISTRY.find((entry) => entry.match.test(value));
    // Match the brand on the raw model id first, then the display label as a hint.
    const brandSource = modelByKey[value] ?? modelLabel;
    const modelEntry = brandSource
      ? REGISTRY.find((entry) => entry.match.test(brandSource))
      : undefined;
    // The actual model's brand is the most accurate mark: a `general-chat`
    // workspace running DeepSeek should show the DeepSeek glyph, not a generic
    // bot. So the model brand wins, with the workspace-name entry as the fallback
    // when the model is unknown — except `override` entries (e.g. Azure) the
    // model id can't disambiguate.
    const meta = (nameEntry?.override ? nameEntry : (modelEntry ?? nameEntry))?.meta;
    return {
      value,
      // Friendly label only: display name, else the workspace name — never the
      // raw model id (that stays an icon-matching detail).
      label: modelLabel ?? meta?.label ?? value,
      icon: meta?.icon ?? <Bot className="size-4" aria-hidden />,
      group: meta?.group ?? t('AiChat.Workspace.GroupAvailable', 'Available'),
      capabilities: (meta?.capabilities ?? []).map((capability) => capabilityGlyph(capability, t)),
    };
  });
}
