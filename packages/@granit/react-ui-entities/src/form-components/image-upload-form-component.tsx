import { ImageUploadField, type AspectRatio } from '@granit/react-ui-blob-storage';

import type { EntityFormComponent } from '@granit/react-entities';

interface ImageUploadConfig {
  readonly containerName?: string;
  readonly aspectRatio?: AspectRatio;
  readonly maxSizeMb?: number;
}

export const ImageUploadFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
}) => {
  const config = (field.config ?? {}) as ImageUploadConfig;
  return (
    <ImageUploadField
      id={`field-${field.propertyName}`}
      name={field.propertyName}
      value={typeof value === 'string' ? value : null}
      onChange={onChange}
      disabled={readOnly}
      containerName={config.containerName ?? 'images'}
      aspectRatio={config.aspectRatio}
      maxSizeBytes={config.maxSizeMb !== undefined ? config.maxSizeMb * 1024 * 1024 : undefined}
    />
  );
};
