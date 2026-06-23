import { AIPermissions } from '@granit/ai';
import { useAIChatStream, useAIEmbeddings } from '@granit/react-ai';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@granit/react-ui';
import { Loader2, Send, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { AIWorkspaceResponse } from '@granit/ai';

interface WorkspaceTestPanelProps {
  readonly workspace: AIWorkspaceResponse;
}

export function WorkspaceTestPanel({ workspace }: WorkspaceTestPanelProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canChat =
    (workspace.capabilities?.chat ?? false) && hasPermission(AIPermissions.Chat.Execute);
  const canEmbed =
    (workspace.capabilities?.embeddings ?? false) &&
    hasPermission(AIPermissions.Embeddings.Execute);
  const defaultTab = canChat ? 'chat' : 'embeddings';

  if (!canChat && !canEmbed) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('AI.Workspaces.Test.Title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="chat" disabled={!canChat}>
              {t('AI.Workspaces.Test.ChatTab')}
            </TabsTrigger>
            <TabsTrigger value="embeddings" disabled={!canEmbed}>
              {t('AI.Workspaces.Test.EmbeddingsTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-4">
            <ChatTestTab workspaceName={workspace.name} />
          </TabsContent>
          <TabsContent value="embeddings" className="mt-4">
            <EmbeddingsTestTab workspaceName={workspace.name} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// -- Chat tab ----------------------------------------------------------------

function ChatTestTab({ workspaceName }: { readonly workspaceName: string }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const { content, isStreaming, error, send, abort } = useAIChatStream();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    send(workspaceName, { messages: [{ role: 'user', content: trimmed }] });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setInput('');
    abort();
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('AI.Workspaces.Test.ChatPlaceholder')}
          rows={3}
          disabled={isStreaming}
        />
      </div>
      <div className="flex gap-2">
        {isStreaming ? (
          <Button type="button" variant="destructive" size="sm" onClick={abort}>
            <Square className="mr-2 h-3 w-3" />
            {t('AI.Workspaces.Test.Stop')}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={handleSend} disabled={!input.trim()}>
            <Send className="mr-2 h-3 w-3" />
            {t('AI.Workspaces.Test.Send')}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isStreaming}
        >
          <Trash2 className="mr-2 h-3 w-3" />
          {t('AI.Workspaces.Test.Clear')}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {content && (
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {t('AI.Workspaces.Test.Response')}
          </p>
          <div className="whitespace-pre-wrap text-sm">{content}</div>
          {isStreaming && <Loader2 className="mt-2 h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  );
}

// -- Embeddings tab ----------------------------------------------------------

function EmbeddingsTestTab({ workspaceName }: { readonly workspaceName: string }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const { generateAsync, data, isPending, error } = useAIEmbeddings();

  const handleGenerate = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    await generateAsync(workspaceName, { inputs: [trimmed] });
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t('AI.Workspaces.Test.EmbeddingsPlaceholder')}
        rows={3}
        disabled={isPending}
      />
      <Button
        type="button"
        size="sm"
        onClick={handleGenerate}
        disabled={!input.trim() || isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <Send className="mr-2 h-3 w-3" />
        )}
        {t('AI.Workspaces.Test.Generate')}
      </Button>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {data && (
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {t('AI.Workspaces.Test.EmbeddingsResult', {
              dimensions: data.embeddings[0]?.vector.length ?? 0,
            })}
          </p>
          <pre className="max-h-48 overflow-auto text-xs text-muted-foreground">
            {JSON.stringify(data.embeddings[0]?.vector.slice(0, 20), null, 2)}
            {(data.embeddings[0]?.vector.length ?? 0) > 20 && '\n  ...'}
          </pre>
        </div>
      )}
    </div>
  );
}
