import { useProviderUsers } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@granit/react-ui';
import { useState } from 'react';

import type { IdentityUser } from '@granit/identity';

interface UserSearchComboboxProps {
  readonly onSelect: (user: IdentityUser) => void;
  readonly excludeUserIds?: readonly string[];
  readonly placeholder?: string;
}

export function UserSearchCombobox({
  onSelect,
  excludeUserIds = [],
  placeholder,
}: Readonly<UserSearchComboboxProps>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useProviderUsers(
    search.length >= 2 ? { search, max: 10 } : undefined
  );

  const filtered = users?.filter((u) => !excludeUserIds.includes(u.userId)) ?? [];

  return (
    <Command data-slot="user-search-combobox" shouldFilter={false}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={placeholder ?? t('Identity.Users.SearchPlaceholder', 'Search users...')}
      />
      <CommandList>
        {isLoading && search.length >= 2 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('Common.Loading', 'Loading...')}
          </div>
        )}
        {!isLoading && search.length >= 2 && filtered.length === 0 && (
          <CommandEmpty>{t('Common.NoResults', 'No results found')}</CommandEmpty>
        )}
        {filtered.map((user) => (
          <CommandItem
            key={user.userId}
            value={user.userId}
            onSelect={() => {
              onSelect(user);
              setSearch('');
            }}
          >
            <span className="font-medium">
              {user.firstName} {user.lastName}
            </span>
            <span className="ml-2 text-muted-foreground">{user.email}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
