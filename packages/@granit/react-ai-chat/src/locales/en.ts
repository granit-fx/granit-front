/** Translation shape for the `aiChat` namespace. */
export interface ChatTranslations {
  readonly Thread: {
    readonly Empty: string;
    readonly You: string;
    readonly Assistant: string;
    readonly AssistantTyping: string;
  };
  readonly Composer: {
    readonly Placeholder: string;
    readonly Send: string;
    readonly Stop: string;
    readonly Attach: string;
    readonly Workspace: string;
    readonly RemoveAttachment: string;
    readonly RemovePrompt: string;
  };
  readonly Suggestions: {
    readonly Title: string;
  };
  readonly Clarification: {
    readonly Other: string;
    readonly OtherPlaceholder: string;
    readonly Submit: string;
  };
  readonly Pickers: {
    readonly Prompts: string;
    readonly Mentions: string;
    readonly NoResults: string;
    readonly Loading: string;
  };
}

export const aiChatTranslationsEn: ChatTranslations = {
  Thread: {
    Empty: 'Ask anything about your app.',
    You: 'You',
    Assistant: 'Assistant',
    AssistantTyping: 'Assistant is typing…',
  },
  Composer: {
    Placeholder: 'Ask your app… ( / for prompts, @ to mention )',
    Send: 'Send',
    Stop: 'Stop',
    Attach: 'Attach a file',
    Workspace: 'Workspace',
    RemoveAttachment: 'Remove attachment',
    RemovePrompt: 'Remove prompt',
  },
  Suggestions: {
    Title: 'Suggested actions',
  },
  Clarification: {
    Other: 'Something else…',
    OtherPlaceholder: 'Type your answer',
    Submit: 'Send',
  },
  Pickers: {
    Prompts: 'Prompts',
    Mentions: 'Mentions',
    NoResults: 'No results',
    Loading: 'Searching…',
  },
};
