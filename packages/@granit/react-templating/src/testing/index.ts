// ---------------------------------------------------------------------------
// @granit/react-templating/testing — Mock data & MSW handlers
// ---------------------------------------------------------------------------

export {
  mockTemplateCategories,
  mockTemplatesData,
  toTemplateDetail,
  toTemplateListItem,
} from './data';
export type { MockTemplate } from './data';
export { createTemplatesHandlers, templateQueryMetadata } from './handlers';
