import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { buildWorkspaceOptions } from '../model-catalog';

// The catalog only needs `t` for the capability labels and the fallback group
// name; echo the fallback (or the key) so assertions stay i18n-independent.
type TranslateFn = Parameters<typeof buildWorkspaceOptions>[1];
const t = ((key: string, fallback?: string) => fallback ?? key) as unknown as TranslateFn;

describe('buildWorkspaceOptions', () => {
  it('decorates a known model workspace with its provider group and capabilities', () => {
    const [option] = buildWorkspaceOptions(['deepseek-v3.2'], t);

    expect(option.value).toBe('deepseek-v3.2');
    expect(option.label).toBe('deepseek-v3.2');
    expect(option.group).toBe('DeepSeek');
    expect(option.capabilities).toHaveLength(2); // tools + reasoning
    expect(isValidElement(option.icon)).toBe(true);
  });

  it('matches registry entries by substring, case-insensitively', () => {
    expect(buildWorkspaceOptions(['Auto'], t)[0].capabilities).toHaveLength(0);
    expect(buildWorkspaceOptions(['CLAUDE-OPUS'], t)[0].group).toBe('Anthropic');
    expect(buildWorkspaceOptions(['tenant-support-bot'], t)[0].capabilities).toHaveLength(2);
  });

  it('falls back to a generic mark and the "Available" group for unknown workspaces', () => {
    const [option] = buildWorkspaceOptions(['mystery-model'], t);

    expect(option.value).toBe('mystery-model');
    expect(option.label).toBe('mystery-model');
    expect(option.group).toBe('Available');
    expect(option.capabilities).toEqual([]);
    expect(isValidElement(option.icon)).toBe(true);
  });

  it('assigns demo workspace names to their provider group', () => {
    expect(buildWorkspaceOptions(['default'], t)[0].group).toBe('OpenAI');
    expect(buildWorkspaceOptions(['code-review'], t)[0].group).toBe('OpenAI');
    expect(buildWorkspaceOptions(['translation'], t)[0].group).toBe('Azure OpenAI');
  });

  it('matches the brand via the model name when the workspace name is generic', () => {
    const [option] = buildWorkspaceOptions(['summarizer'], t, { summarizer: 'Mistral 7B' });

    expect(option.group).toBe('Mistral AI');
    expect(option.label).toBe('Mistral 7B'); // model name still drives the label
  });

  it('prefers an explicit override workspace-name entry over the model name', () => {
    // `translation` is pinned (override) to Azure OpenAI even though its model is a GPT.
    const [option] = buildWorkspaceOptions(['translation'], t, { translation: 'GPT-4o (Azure)' });

    expect(option.group).toBe('Azure OpenAI');
  });

  it("lets the actual model's brand win over a generic functional workspace name", () => {
    // A real-backend `general-chat` workspace running DeepSeek shows the DeepSeek
    // brand (from the model id), not the generic bot its name entry alone gives —
    // while the label stays the workspace name, not the raw model id.
    const [option] = buildWorkspaceOptions(
      ['general-chat'],
      t,
      {},
      {
        'general-chat': 'deepseek-r1:7b',
      }
    );

    expect(option.group).toBe('DeepSeek');
    expect(option.label).toBe('general-chat');
  });

  it('uses the model id only for the icon, never as the picker label', () => {
    // displayName set → label is the friendly display name; the raw model
    // id drives the brand but never leaks into the label.
    const [option] = buildWorkspaceOptions(
      ['general-chat'],
      t,
      { 'general-chat': 'DeepSeek R1' },
      { 'general-chat': 'deepseek-r1:7b' }
    );

    expect(option.group).toBe('DeepSeek');
    expect(option.label).toBe('DeepSeek R1');
  });

  it('renders capability glyphs as accessible, labelled elements', () => {
    const [option] = buildWorkspaceOptions(['gpt-4o'], t);
    const labels = option.capabilities.map((glyph) =>
      isValidElement<{ 'aria-label'?: string }>(glyph) ? glyph.props['aria-label'] : undefined
    );

    // gpt → tools + vision + reasoning, each carrying its fallback label.
    expect(labels).toEqual(['Uses tools', 'Understands images', 'Advanced reasoning']);
  });
});
