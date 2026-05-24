// --- Entry types (mirror Granit.Timeline .NET enum) ---
// Serialized as PascalCase strings via the framework's global `JsonStringEnumConverter`.

export type TimelineEntryType = 'Comment' | 'SystemLog' | 'InternalNote';

export const TimelineEntryType = {
  Comment: 'Comment',
  SystemLog: 'SystemLog',
  InternalNote: 'InternalNote',
} as const satisfies Record<string, TimelineEntryType>;
