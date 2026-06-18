/** Translation shape for the `aiChat` namespace. */
export interface ChatTranslations {
  readonly Thread: {
    readonly Empty: string;
    readonly You: string;
    readonly Assistant: string;
    readonly AssistantTyping: string;
    /** Accessible label for the scroll-to-latest button. */
    readonly ScrollToLatest?: string;
  };
  readonly Composer: {
    readonly Placeholder: string;
    readonly Send: string;
    readonly Stop: string;
    readonly Attach: string;
    readonly Workspace: string;
    /** Placeholder for the workspace picker's search field. */
    readonly SearchWorkspaces?: string;
    readonly RemoveAttachment: string;
    readonly RemovePrompt: string;
  };
  readonly Tools: {
    /**
     * In-progress labels keyed by the backend tool name (`snake_case`). Apps
     * extend this map with their own tools; unmapped names fall back to
     * {@link Fallback}.
     */
    readonly Names: Readonly<Record<string, string>>;
    /** Shown for a tool whose name has no entry in {@link Names}. */
    readonly Fallback: string;
    /** Derived "thinking" indicator: a tool finished, the next step is pending. */
    readonly Thinking: string;
    /** Accessible status appended to a resolved chip's label. */
    readonly Succeeded: string;
    readonly Failed: string;
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
    ScrollToLatest: 'Scroll to latest',
  },
  Composer: {
    Placeholder: 'Ask your app… ( / for prompts, @ to mention )',
    Send: 'Send',
    Stop: 'Stop',
    Attach: 'Attach a file',
    Workspace: 'Workspace',
    SearchWorkspaces: 'Search models…',
    RemoveAttachment: 'Remove attachment',
    RemovePrompt: 'Remove prompt',
  },
  Tools: {
    Names: {
      query_data: 'Searching data…',
      search: 'Searching…',
    },
    Fallback: 'Working…',
    Thinking: 'Thinking…',
    Succeeded: 'done',
    Failed: 'failed',
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
