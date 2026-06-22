// @granit/react-ui-catalog — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { catalogTranslationsEn } from "@granit/react-ui-catalog";
//   i18n.addResourceBundle("en", "translation", catalogTranslationsEn, true, true);
//
// Keys are flat strings (the lookup runs with keySeparator / nsSeparator
// disabled, so these are exact string keys, not namespace traversals). This
// package owns the `Catalog.*` keys only — the shared `Common.*` / `Operators.*`
// keys belong to the host application root.

export const catalogTranslationsEn = {
  'Catalog.Actions.AddMapping': 'Add mapping',
  'Catalog.Actions.AddMetadata': 'Add entry',
  'Catalog.Actions.Archive': 'Archive',
  'Catalog.Actions.CreateProduct': 'Create product',
  'Catalog.Actions.Publish': 'Publish',
  'Catalog.Actions.RemoveMapping': 'Remove mapping',
  'Catalog.Actions.RemoveMetadata': 'Remove entry',
  'Catalog.Actions.SaveMetadata': 'Save metadata',
  'Catalog.ArchiveError': 'Failed to archive product',
  'Catalog.ArchiveSuccess': 'Product archived',
  'Catalog.BackToList': 'Back to products',
  'Catalog.Columns.Mappings': 'Mappings',
  'Catalog.Columns.Name': 'Name',
  'Catalog.Columns.Sku': 'SKU',
  'Catalog.Columns.Status': 'Status',
  'Catalog.Columns.Type': 'Type',
  'Catalog.Columns.Unit': 'Unit',
  'Catalog.CreateError': 'Failed to create product',
  'Catalog.CreateSubtitle':
    'Create a new product in Draft status. Publish it later to make it available.',
  'Catalog.CreateSuccess': 'Product created',
  'Catalog.CreateTitle': 'New product',
  'Catalog.EditNotAllowedBody':
    'Only Draft products can be edited. Use metadata or external mappings to update Published or Archived products.',
  'Catalog.EditNotAllowedTitle': 'Editing not allowed',
  'Catalog.EditTitle': 'Edit {{name}}',
  'Catalog.Fields.Description': 'Description',
  'Catalog.Fields.Name': 'Name',
  'Catalog.Fields.Sku': 'SKU',
  'Catalog.Fields.SkuHelp':
    'Unique identifier. A-Z, 0-9, dash, dot or underscore. Immutable after creation.',
  'Catalog.Fields.Type': 'Type',
  'Catalog.Fields.TypeHelp': 'Free-form (e.g. Service, Good).',
  'Catalog.Fields.Unit': 'Unit',
  'Catalog.Fields.UnitHelp': 'Unit of measure (e.g. each, hour, month).',
  'Catalog.Lifecycle.Archived': 'Archived',
  'Catalog.Lifecycle.Draft': 'Draft',
  'Catalog.Lifecycle.Published': 'Published',
  'Catalog.LoadError': 'Failed to load products',
  'Catalog.Mapping.ExternalId': 'External id',
  'Catalog.Mapping.Provider': 'Provider',
  'Catalog.MappingAddError': 'Failed to add mapping',
  'Catalog.MappingAddSuccess': 'Mapping added',
  'Catalog.MappingRemoveError': 'Failed to remove mapping',
  'Catalog.MappingRemoveSuccess': 'Mapping removed',
  'Catalog.MetadataKeyPlaceholder': 'Key',
  'Catalog.MetadataSaveError': 'Failed to save metadata',
  'Catalog.MetadataSaveSuccess': 'Metadata saved',
  'Catalog.MetadataValuePlaceholder': 'Value',
  'Catalog.NoMappings': 'No external provider mappings yet.',
  'Catalog.NoMetadata': 'No metadata yet.',
  'Catalog.NoProducts': 'No products yet.',
  'Catalog.NotFound': 'Product not found.',
  'Catalog.PublishError': 'Failed to publish product',
  'Catalog.PublishSuccess': 'Product published',
  'Catalog.PublishedOnlyNoticeBody':
    'The backend currently exposes Published products only. Drafts you create appear in the catalog once you publish them.',
  'Catalog.PublishedOnlyNoticeTitle': 'Published products only',
  'Catalog.Section.ExternalMappings': 'External mappings',
  'Catalog.Section.Info': 'Information',
  'Catalog.Section.Metadata': 'Metadata',
  'Catalog.StrongConfirmAriaLabel': 'Confirmation input',
  'Catalog.StrongConfirmInstruction': 'Type "{{name}}" to confirm',
  'Catalog.Subtitle': 'Manage products mirrored from Granit.Catalog.',
  'Catalog.Title': 'Catalog',
  'Catalog.UpdateError': 'Failed to update product',
  'Catalog.UpdateSuccess': 'Product updated',
} as const;

export type CatalogTranslations = typeof catalogTranslationsEn;
