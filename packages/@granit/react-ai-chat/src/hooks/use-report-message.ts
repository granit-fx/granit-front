import { reportConversationMessage } from '@granit/ai-chat';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { logger } from '../logger';
import { useAIChatConfig } from '../providers/ai-chat-provider';

import type { MessageId, MessageReportCategory } from '@granit/ai-chat';

const log = logger.child('useReportMessage');

export interface ReportMessageVariables {
  readonly messageId: MessageId;
  readonly reason: string;
  readonly category?: MessageReportCategory | null;
}

export interface UseReportMessageReturn {
  readonly report: (variables: ReportMessageVariables) => void;
  readonly reportAsync: (variables: ReportMessageVariables) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to report (flag) a message for review. Does not invalidate any cache
 * — a report never changes conversation state. Requires
 * `AIChat.Conversations.Report`.
 */
export function useReportMessage(): UseReportMessageReturn {
  const config = useAIChatConfig();

  const mutation = useMutation({
    mutationFn: ({ messageId, reason, category }: ReportMessageVariables) =>
      reportConversationMessage(config.client, config.basePath, messageId, { reason, category }),
    onSuccess: (_data, { messageId, category }) => {
      // No PII: report reason text is never logged, only the id and category.
      log.info('Message reported', { messageId, category: category ?? null });
    },
  });

  const report = useCallback(
    (variables: ReportMessageVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  const reportAsync = useCallback(
    async (variables: ReportMessageVariables) => {
      await mutation.mutateAsync(variables);
    },
    [mutation]
  );

  return { report, reportAsync, isPending: mutation.isPending, error: mutation.error };
}
