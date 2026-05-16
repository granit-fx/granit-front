// --- Entry types (mirror Granit.Timeline .NET enum) ---

export const TimelineEntryType = {
  Comment: 0,
  SystemLog: 1,
  InternalNote: 2,
} as const;

export type TimelineEntryTypeValue = (typeof TimelineEntryType)[keyof typeof TimelineEntryType];
