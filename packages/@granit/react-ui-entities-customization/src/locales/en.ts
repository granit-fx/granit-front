/**
 * English admin strings for the entity-customization UI. Flat `customization:*`
 * and `views:*` keys in the `translation` namespace — the `customization:` /
 * `views:` prefix is a literal part of the key, not an i18next namespace (the
 * host registers them with separators disabled, so the dotted keys are looked
 * up verbatim).
 */
export const entitiesCustomizationAdminTranslationsEn = {
  'customization:Form.SaveSuccess': 'Form layout saved',
  'customization:Form.Title': 'Form layout',
  'customization:Inspector.Description':
    'Resolution chain for the selected field, layered manifest → tenant → user.',
  'customization:Inspector.Layer1.Hidden': 'Hidden',
  'customization:Inspector.Layer1.NoOverride': 'No admin override',
  'customization:Page.AccessDenied.Body':
    'You need EntitiesCustomization.Forms.Manage or Entities.Views.Manage to use this page.',
  'customization:Page.AccessDenied.Title': 'Access denied',
  'customization:Page.Subtitle':
    'Reorder, regroup, and hide fields per entity (Layer 1 admin overrides).',
  'customization:Page.Title': 'Layout customization',
  'customization:Picker.Empty': 'Pick an entity to start editing.',
  'customization:Picker.Entity': 'Entity',
  'customization:Picker.LayoutKind': 'Layout',
  'customization:Picker.SelectEntity': 'Select entity',
  'customization:Tabs.Forms': 'Forms',
  'customization:Tabs.Workspaces': 'Workspaces',
  'customization:TopTab.Layouts': 'Layouts',
  'customization:TopTab.Views': 'Views',
  'customization:Workspace.NoItems': 'This workspace has no editable items.',
  'customization:Workspace.PickToStart': 'Pick a workspace to start editing.',
  'customization:Workspace.PickerPlaceholder': 'Select workspace',
  'customization:Workspace.SaveSuccess': 'Workspace layout saved',
  'customization:Workspace.Title': 'Workspace layout',
  'views:Action.Delete': 'Delete',
  'views:Action.Edit': 'Edit',
  'views:Action.NewView': 'New view',
  'views:Action.Pin': 'Pin',
  'views:Action.SetDefault': 'Set as tenant default',
  'views:Action.SetPersonalDefault': 'Set as personal default',
  'views:Action.Unpin': 'Unpin',
  'views:Action.UnsetDefault': 'Remove tenant default',
  'views:Action.UnsetPersonalDefault': 'Remove personal default',
  'views:Create.Success': 'View created',
  'views:Create.Title': 'New view',
  'views:Delete.ConfirmBody': 'This action cannot be undone.',
  'views:Delete.ConfirmTitle': 'Delete this view?',
  'views:Delete.Success': 'View deleted',
  'views:Edit.Success': 'View updated',
  'views:Edit.Title': 'Edit view',
  'views:Field.Description': 'Description',
  'views:Field.DescriptionPlaceholder': 'Optional description',
  'views:Field.Kind': 'Kind',
  'views:Field.Name': 'Name',
  'views:Field.NamePlaceholder': 'My view',
  'views:Page.Empty': 'No views yet for this entity.',
  'views:Page.PickEntity': 'Pick an entity to see its views.',
  'views:Page.Title': 'Saved views',
} as const;
