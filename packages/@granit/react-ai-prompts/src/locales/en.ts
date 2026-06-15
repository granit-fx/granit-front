/** Translation shape for the `aiPrompts` namespace. */
export interface PromptTranslations {
  readonly Picker: {
    readonly Title: string;
    readonly NoResults: string;
    readonly System: string;
  };
  readonly Catalogue: {
    readonly Empty: string;
    readonly New: string;
    readonly Edit: string;
    readonly Delete: string;
    readonly Customise: string;
    readonly System: string;
    readonly DeleteConfirm: string;
  };
  readonly Form: {
    readonly Name: string;
    readonly NamePlaceholder: string;
    readonly ShortDescription: string;
    readonly Content: string;
    readonly ContentPlaceholder: string;
    readonly Icon: string;
    readonly Save: string;
    readonly Cancel: string;
    readonly NameRequired: string;
    readonly ContentRequired: string;
  };
  readonly IconPicker: {
    readonly IconLabel: string;
    readonly ColorLabel: string;
    readonly ColorHexLabel: string;
    readonly ColorInvalid: string;
  };
}

export const aiPromptsTranslationsEn: PromptTranslations = {
  Picker: {
    Title: 'Prompts',
    NoResults: 'No prompts',
    System: 'System',
  },
  Catalogue: {
    Empty: 'No prompts yet.',
    New: 'New prompt',
    Edit: 'Edit',
    Delete: 'Delete',
    Customise: 'Customise',
    System: 'System',
    DeleteConfirm: 'Delete this prompt?',
  },
  Form: {
    Name: 'Name',
    NamePlaceholder: 'e.g. Summarize',
    ShortDescription: 'Short description',
    Content: 'Instruction',
    ContentPlaceholder: 'What should the assistant do?',
    Icon: 'Icon',
    Save: 'Save',
    Cancel: 'Cancel',
    NameRequired: 'A name is required.',
    ContentRequired: 'An instruction is required.',
  },
  IconPicker: {
    IconLabel: 'Icon',
    ColorLabel: 'Icon colour',
    ColorHexLabel: 'Icon colour hex',
    ColorInvalid: 'Use #RRGGBB or #RRGGBBAA.',
  },
};
