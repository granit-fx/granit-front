import { mockEntityManifest } from '@granit/react-entities/testing';
import { fireEvent, render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LanguageFormComponent } from './language-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';
import type { LanguageInfo } from '@granit/localization';

const { mockUseLanguages } = vi.hoisted(() => ({
  mockUseLanguages: vi.fn<() => LanguageInfo[]>(),
}));

vi.mock('@granit/react-ui-localization', () => ({
  useLanguages: () => mockUseLanguages(),
}));

interface SelectMockProps {
  readonly value: string;
  readonly onValueChange: (next: string) => void;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}
interface ItemMockProps {
  readonly value: string;
  readonly children: ReactNode;
}

vi.mock('@granit/react-ui', () => ({
  Select: ({ value, onValueChange, disabled, children }: SelectMockProps) => (
    <div data-testid="select" data-value={value} data-disabled={String(Boolean(disabled))}>
      <button type="button" data-testid="pick-fr" onClick={() => onValueChange('fr')} />
      <button type="button" data-testid="pick-empty" onClick={() => onValueChange('')} />
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: ItemMockProps) => (
    <div data-testid={`item-${value}`}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { readonly placeholder?: string }) => <span>{placeholder}</span>,
}));

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Culture', component: 'language', ...overrides };
}

const LANGUAGES: LanguageInfo[] = [
  { cultureName: 'fr', displayName: 'Français', isDefault: true },
  { cultureName: 'en', displayName: 'English', isDefault: false },
];

describe('LanguageFormComponent', () => {
  beforeEach(() => {
    mockUseLanguages.mockReturnValue(LANGUAGES);
  });
  afterEach(() => vi.clearAllMocks());

  it('renders one item per language from the languages context', () => {
    const { getByTestId } = render(
      <LanguageFormComponent field={field()} value="" onChange={vi.fn()} readOnly={false} />
    );
    expect(getByTestId('item-fr').textContent).toBe('Français');
    expect(getByTestId('item-en').textContent).toBe('English');
  });

  it('binds a string value as the current selection', () => {
    const { getByTestId } = render(
      <LanguageFormComponent field={field()} value="en" onChange={vi.fn()} readOnly={false} />
    );
    expect(getByTestId('select').getAttribute('data-value')).toBe('en');
  });

  it('collapses a non-string value to an empty selection', () => {
    const { getByTestId } = render(
      <LanguageFormComponent field={field()} value={99} onChange={vi.fn()} readOnly={false} />
    );
    expect(getByTestId('select').getAttribute('data-value')).toBe('');
  });

  it('emits the chosen culture on change', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <LanguageFormComponent field={field()} value="" onChange={onChange} readOnly={false} />
    );
    fireEvent.click(getByTestId('pick-fr'));
    expect(onChange).toHaveBeenCalledWith('fr');
  });

  it('emits null when the selection is cleared to empty', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <LanguageFormComponent field={field()} value="fr" onChange={onChange} readOnly={false} />
    );
    fireEvent.click(getByTestId('pick-empty'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disables the select when readOnly is set', () => {
    const { getByTestId } = render(
      <LanguageFormComponent field={field()} value="fr" onChange={vi.fn()} readOnly={true} />
    );
    expect(getByTestId('select').getAttribute('data-disabled')).toBe('true');
  });
});
