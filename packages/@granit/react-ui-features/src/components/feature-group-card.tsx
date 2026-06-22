import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@granit/react-ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { FeatureValueBadge } from './feature-value-badge';

import type { FeatureGroupResponse } from '@granit/features';

interface FeatureGroupCardProps {
  readonly group: FeatureGroupResponse;
  /** Resolved feature values keyed by name (from `useFeatureValues`). */
  readonly values?: Readonly<Record<string, string>>;
}

function getTypeBadgeVariant(valueType: string) {
  switch (valueType) {
    case 'Toggle':
      return 'default' as const;
    case 'Numeric':
      return 'outline' as const;
    case 'Selection':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

function getTypeLabel(valueType: string, t: (key: string) => string) {
  switch (valueType) {
    case 'Toggle':
      return t('Features.Type.Toggle');
    case 'Numeric':
      return t('Features.Type.Numeric');
    case 'Selection':
      return t('Features.Type.Selection');
    default:
      return valueType;
  }
}

export function FeatureGroupCard({ group, values }: FeatureGroupCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  return (
    <Card data-slot="feature-group-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="cursor-pointer">
          <CollapsibleTrigger className="flex w-full items-center gap-2">
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            <CardTitle className="flex-1 text-left">{group.displayName ?? group.name}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {t('Features.Group.Count', { count: group.features.length })}
            </span>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            <div className="divide-y">
              {group.features.map((feature) => {
                const value = values?.[feature.name];
                return (
                  <Link
                    key={feature.name}
                    to={`/features/${encodeURIComponent(feature.name)}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {feature.displayName ?? feature.name}
                      </p>
                      {feature.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {value !== undefined && (
                        <FeatureValueBadge definition={feature} value={value} />
                      )}
                      <Badge variant={getTypeBadgeVariant(feature.valueType)}>
                        {getTypeLabel(feature.valueType, t)}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
