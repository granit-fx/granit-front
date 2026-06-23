import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { AIModelCapabilities } from '@granit/ai';

const CAPABILITY_KEYS = [
  'chat',
  'embeddings',
  'vision',
  'imageGeneration',
  'audio',
  'toolUse',
  'streaming',
  'structuredOutput',
] as const satisfies readonly (keyof Omit<AIModelCapabilities, 'extensions'>)[];

interface WorkspaceCapabilitiesProps {
  readonly capabilities: AIModelCapabilities | null;
}

export function WorkspaceCapabilities({ capabilities }: WorkspaceCapabilitiesProps) {
  const { t } = useTranslation();

  if (!capabilities) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {CAPABILITY_KEYS.map((key) => (
        <Badge
          key={key}
          variant={capabilities[key] ? 'default' : 'outline'}
          className={capabilities[key] ? '' : 'text-muted-foreground/50 border-muted-foreground/20'}
        >
          {t(`AI.Workspaces.Capabilities.${key}`)}
        </Badge>
      ))}
      {capabilities.extensions.map((ext) => (
        <Badge key={ext} variant="secondary">
          {ext}
        </Badge>
      ))}
    </div>
  );
}
