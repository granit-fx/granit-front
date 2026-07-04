import { mockEntityManifest } from '@granit/react-entities/testing';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImageUploadFormComponent } from './image-upload-form-component';

import type { EntityFormFieldManifest } from '@granit/entities';

interface LeafMockProps {
  readonly id?: string;
  readonly name?: string;
  readonly value: string | null;
  readonly onChange: (next: string | null) => void;
  readonly disabled?: boolean;
  readonly containerName: string;
  readonly aspectRatio?: string;
  readonly maxSizeBytes?: number;
}

vi.mock('@granit/react-ui-blob-storage', () => ({
  ImageUploadField: ({
    id,
    name,
    value,
    onChange,
    disabled,
    containerName,
    aspectRatio,
    maxSizeBytes,
  }: LeafMockProps) => (
    <div
      data-testid="leaf"
      data-id={id}
      data-name={name}
      data-value={value ?? 'NULL'}
      data-disabled={String(Boolean(disabled))}
      data-container={containerName}
      data-aspect={aspectRatio ?? 'NONE'}
      data-maxbytes={maxSizeBytes === undefined ? 'NONE' : String(maxSizeBytes)}
    >
      <button type="button" data-testid="emit" onClick={() => onChange('blob-1')} />
    </div>
  ),
}));

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Avatar', component: 'image', config: null, ...overrides };
}

describe('ImageUploadFormComponent', () => {
  it('applies default container and omits aspect/max-size when config is null', () => {
    const { getByTestId } = render(
      <ImageUploadFormComponent
        field={field()}
        value="blob-existing"
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    const leaf = getByTestId('leaf');
    expect(leaf.getAttribute('data-container')).toBe('images');
    expect(leaf.getAttribute('data-aspect')).toBe('NONE');
    expect(leaf.getAttribute('data-maxbytes')).toBe('NONE');
    expect(leaf.getAttribute('data-value')).toBe('blob-existing');
    expect(leaf.getAttribute('data-id')).toBe('field-Avatar');
    expect(leaf.getAttribute('data-name')).toBe('Avatar');
    expect(leaf.getAttribute('data-disabled')).toBe('false');
  });

  it('maps config container/aspectRatio and converts maxSizeMb to bytes', () => {
    const { getByTestId } = render(
      <ImageUploadFormComponent
        field={field({ config: { containerName: 'avatars', aspectRatio: '16:9', maxSizeMb: 2 } })}
        value={42}
        onChange={vi.fn()}
        readOnly={false}
      />
    );
    const leaf = getByTestId('leaf');
    expect(leaf.getAttribute('data-container')).toBe('avatars');
    expect(leaf.getAttribute('data-aspect')).toBe('16:9');
    expect(leaf.getAttribute('data-maxbytes')).toBe(String(2 * 1024 * 1024));
    expect(leaf.getAttribute('data-value')).toBe('NULL');
  });

  it('forwards the onChange callback directly', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <ImageUploadFormComponent field={field()} value={null} onChange={onChange} readOnly={false} />
    );
    fireEvent.click(getByTestId('emit'));
    expect(onChange).toHaveBeenCalledWith('blob-1');
  });

  it('disables the field when readOnly is set', () => {
    const { getByTestId } = render(
      <ImageUploadFormComponent field={field()} value={null} onChange={vi.fn()} readOnly={true} />
    );
    expect(getByTestId('leaf').getAttribute('data-disabled')).toBe('true');
  });
});
