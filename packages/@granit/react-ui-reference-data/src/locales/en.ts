/**
 * English admin strings for the Reference-Data toolkit. Flat `ReferenceData.Common.*`
 * keys in the `translation` namespace — the default `i18nPrefix` the generic
 * components fall back to when a domain feature does not pass its own prefix. The
 * host registers them with separators disabled, so the dotted keys are looked up
 * verbatim.
 */
export const referenceDataTranslationsEn = {
  'ReferenceData.Common.Actions.Deactivate': 'Deactivate',
  'ReferenceData.Common.Actions.Edit': 'Edit',
  'ReferenceData.Common.Actions.Menu': 'Actions for {{name}}',
  'ReferenceData.Common.Actions.Reactivate': 'Reactivate',
  'ReferenceData.Common.Columns.Active': 'Active',
  'ReferenceData.Common.Columns.Code': 'Code',
  'ReferenceData.Common.Columns.LabelEn': 'Label (EN)',
  'ReferenceData.Common.Columns.LabelFr': 'Label (FR)',
  'ReferenceData.Common.Columns.Metadata': 'Properties',
  'ReferenceData.Common.Columns.ParentCode': 'Parent',
  'ReferenceData.Common.DeactivateDialog.DeactivateMessage':
    'Are you sure you want to deactivate {{name}} ({{code}})?',
  'ReferenceData.Common.DeactivateDialog.DeactivateTitle': 'Deactivate Entry',
  'ReferenceData.Common.DeactivateDialog.ReactivateMessage':
    'Are you sure you want to reactivate {{name}} ({{code}})?',
  'ReferenceData.Common.DeactivateDialog.ReactivateTitle': 'Reactivate Entry',
  'ReferenceData.Common.Form.AddProperty': 'Add property',
  'ReferenceData.Common.Form.Code': 'Code',
  'ReferenceData.Common.Form.ExtraSection': 'Metadata',
  'ReferenceData.Common.Form.IsActive': 'Active',
  'ReferenceData.Common.Form.LabelDe': 'Label (German)',
  'ReferenceData.Common.Form.LabelEn': 'Label (English)',
  'ReferenceData.Common.Form.LabelFr': 'Label (French)',
  'ReferenceData.Common.Form.LabelNl': 'Label (Dutch)',
  'ReferenceData.Common.Form.Labels': 'Labels',
  'ReferenceData.Common.Form.Metadata': 'Properties',
  'ReferenceData.Common.Form.NoMetadata': 'No metadata defined',
  'ReferenceData.Common.Form.ParentCode': 'Parent Code',
  'ReferenceData.Common.Form.ParentCodeHint': 'Leave empty for root entries',
  'ReferenceData.Common.Form.ParentCodePlaceholder': 'Enter parent code',
  'ReferenceData.Common.Form.PropertyKey': 'Key',
  'ReferenceData.Common.Form.PropertyValue': 'Value',
  'ReferenceData.Common.Form.SortOrder': 'Sort Order',
  'ReferenceData.Common.Form.Status': 'Status & Validity',
  'ReferenceData.Common.Form.ValidFrom': 'Valid From',
  'ReferenceData.Common.Form.ValidTo': 'Valid To',
  'ReferenceData.Common.Status.Active': 'Active',
  'ReferenceData.Common.Status.Inactive': 'Inactive',
} as const;
