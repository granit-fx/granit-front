// ---------------------------------------------------------------------------
// @granit/react-reference-data/testing — generic reference-data MSW factory
// ---------------------------------------------------------------------------

export {
  applyStatusPreset,
  buildBaseEntry,
  createReferenceDataHandlers,
  emptyLabels,
} from './handlers';
export type { ReferenceDataHandlersConfig } from './handlers';

export { makeReferenceDataEntry } from './fixtures';
export type { ReferenceDataEntrySeed } from './fixtures';

export { buildReferenceDataMeta } from './meta';
export type { MetaTranslator, ReferenceDataColumnSpec, ReferenceDataMetaConfig } from './meta';
