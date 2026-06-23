import { useProviderUser } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@granit/react-ui';
import { Tags } from 'lucide-react';

import type { UserId } from '@granit/types';

interface UserAttributesCardProps {
  userId: UserId;
}

export function UserAttributesCard({ userId }: Readonly<UserAttributesCardProps>) {
  const { t } = useTranslation();
  const { data: user, isLoading } = useProviderUser(userId);
  const metadata = user?.metadata;

  const entries = metadata ? Object.entries(metadata) : [];

  return (
    <Card data-slot="user-attributes-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-4 w-4" />
          {t('Users.Attributes.Title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {!isLoading && entries.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('Users.Attributes.Empty')}</p>
        )}
        {!isLoading && entries.length > 0 && (
          <dl className="divide-y divide-border">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-foreground">{key}</dt>
                <dd>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {value}
                  </Badge>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
