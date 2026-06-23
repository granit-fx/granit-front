import { useGroups, useIdentityCapabilities } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import { Alert, AlertDescription, AlertTitle, Button } from '@granit/react-ui';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { IdentityGroup } from '@granit/identity';

const SKELETON_ROW_KEYS = ['s0', 's1', 's2', 's3'] as const;

function GroupNode({
  group,
  depth = 0,
  onNavigate,
}: Readonly<{
  group: IdentityGroup;
  depth?: number;
  onNavigate: (groupId: string) => void;
}>) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = group.subGroups.length > 0;

  return (
    <div data-slot="group-node">
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setExpanded(!expanded)}
            aria-label={
              expanded
                ? t('Identity.Groups.Collapse', 'Collapse {{name}}', { name: group.name })
                : t('Identity.Groups.Expand', 'Expand {{name}}', { name: group.name })
            }
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        ) : (
          <span className="size-6" />
        )}
        {expanded && hasChildren ? (
          <FolderOpen className="size-4 text-muted-foreground" />
        ) : (
          <Folder className="size-4 text-muted-foreground" />
        )}
        <button
          className="flex-1 text-left text-sm font-medium hover:underline"
          onClick={() => onNavigate(group.id)}
        >
          {group.name}
        </button>
        {group.path && (
          <span className="font-mono text-xs text-muted-foreground">{group.path}</span>
        )}
      </div>
      {expanded &&
        hasChildren &&
        group.subGroups.map((child) => (
          <GroupNode key={child.id} group={child} depth={depth + 1} onNavigate={onNavigate} />
        ))}
    </div>
  );
}

export function GroupListPage() {
  const { t } = useTranslation();
  const { data: groups, isLoading, error } = useGroups();
  const { data: capabilities } = useIdentityCapabilities();
  const navigate = useNavigate();
  const lifecycleManagedByIdp = capabilities ? !capabilities.supportsGroupManagement : false;

  return (
    <div data-slot="group-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Identity.Groups.Title', 'Groups')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('Identity.Groups.Description', 'Manage identity provider groups')}
        </p>
      </div>

      {lifecycleManagedByIdp && (
        <Alert data-slot="group-lifecycle-notice">
          <Info />
          <AlertTitle>
            {t(
              'Identity.Groups.LifecycleNotSupported.Title',
              'Group lifecycle managed by identity provider'
            )}
          </AlertTitle>
          <AlertDescription>
            {t(
              'Identity.Groups.LifecycleNotSupported.Description',
              "Creating, editing, and deleting groups must be done in the identity provider's admin console."
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          {SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className="h-10 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/50 p-8 text-center text-destructive">
          {t('Common.Error', 'An error occurred while loading data.')}
        </div>
      )}

      {!isLoading && !error && groups && (
        <div className="rounded-lg border">
          {groups.map((group) => (
            <GroupNode
              key={group.id}
              group={group}
              onNavigate={(id) => navigate(`/identity/groups/${id}`)}
            />
          ))}
          {groups.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {t('Common.NoResults', 'No results found')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
