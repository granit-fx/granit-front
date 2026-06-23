import { AUTO_WORKSPACE } from '@granit/ai-chat';
import { useChatWorkspaces } from '@granit/react-ai-chat';
import { useTranslation } from '@granit/react-localization';
import { useSettings, useUpdateSetting } from '@granit/react-settings';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@granit/react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from './logger';

import type { SettingsMap } from '@granit/settings';

const SETTING = {
  DefaultWorkspace: 'Granit.AI.Chat.DefaultWorkspace',
  WebSearchPolicy: 'Granit.AI.Chat.WebSearchPolicy',
  CustomContext: 'Granit.AI.Chat.CustomContext',
} as const;

const WEB_SEARCH_POLICIES = ['Deny', 'Allow', 'AlwaysAsk'] as const;
const CUSTOM_CONTEXT_MAX = 4000;

/**
 * Per-user chat preferences, stored on the User settings scope via the generic
 * settings client (there is no chat-specific settings route). Web search itself
 * is phase 2 — we capture the intent now.
 */
export function ChatSettingsPage() {
  const { t } = useTranslation('translation');
  const settings = useSettings('user');

  return (
    <div data-slot="ai-chat-settings-page" className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('AiChat.Settings.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('AiChat.Settings.Subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('AiChat.Settings.Defaults')}</CardTitle>
        </CardHeader>
        <CardContent>
          {settings.isLoading ? (
            <p className="text-sm text-muted-foreground">{t('Common.Loading')}</p>
          ) : (
            // Keyed on the loaded data so the form initializes from server
            // values without mirroring them via an effect.
            <ChatSettingsForm key={settings.dataUpdatedAt} current={settings.data ?? {}} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChatSettingsForm({ current }: Readonly<{ current: SettingsMap }>) {
  const { t } = useTranslation('translation');
  const update = useUpdateSetting('user');
  const workspaces = useChatWorkspaces();

  const [defaultWorkspace, setDefaultWorkspace] = useState(
    current[SETTING.DefaultWorkspace] ?? AUTO_WORKSPACE
  );
  const [webSearchPolicy, setWebSearchPolicy] = useState(
    current[SETTING.WebSearchPolicy] ?? 'Deny'
  );
  const [customContext, setCustomContext] = useState(current[SETTING.CustomContext] ?? '');

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await Promise.all([
        update.updateAsync(SETTING.DefaultWorkspace, defaultWorkspace),
        update.updateAsync(SETTING.WebSearchPolicy, webSearchPolicy),
        update.updateAsync(SETTING.CustomContext, customContext),
      ]);
      toast.success(t('AiChat.Settings.Saved'));
    } catch (error) {
      logger.error('[ChatSettingsPage] Failed to save chat preferences', error);
      toast.error(t('AiChat.Settings.SaveFailed'));
    }
  };

  const workspaceOptions = workspaces.data?.workspaces ?? [AUTO_WORKSPACE];

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="chat-default-workspace">{t('AiChat.Settings.DefaultWorkspace')}</Label>
        <Select value={defaultWorkspace} onValueChange={setDefaultWorkspace}>
          <SelectTrigger id="chat-default-workspace" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {workspaceOptions.map((ws) => (
              <SelectItem key={ws} value={ws}>
                {ws}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chat-web-search">{t('AiChat.Settings.WebSearch')}</Label>
        <Select value={webSearchPolicy} onValueChange={setWebSearchPolicy}>
          <SelectTrigger id="chat-web-search" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEB_SEARCH_POLICIES.map((policy) => (
              <SelectItem key={policy} value={policy}>
                {t(`AiChat.Settings.WebSearchPolicy.${policy}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t('AiChat.Settings.WebSearchHint')}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chat-custom-context">{t('AiChat.Settings.CustomContext')}</Label>
        <Textarea
          id="chat-custom-context"
          rows={4}
          maxLength={CUSTOM_CONTEXT_MAX}
          value={customContext}
          placeholder={t('AiChat.Settings.CustomContextPlaceholder')}
          onChange={(event) => {
            setCustomContext(event.target.value);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {customContext.length} / {CUSTOM_CONTEXT_MAX}
        </p>
      </div>

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? t('Common.Saving') : t('Common.Save')}
      </Button>
    </form>
  );
}
