/**
 * Framework-agnostic navigation model. Generic over the icon and translation-key
 * types so each app/framework specialises it (e.g. React + lucide-react +
 * i18next `ParseKeys`) without the model itself depending on those libraries.
 * The same model drives every shell — a sidebar renders it as a tree, a mobile
 * shell as a tab bar, a site shell as a horizontal menu.
 */
export interface NavItem<TIcon = unknown, TKey extends string = string> {
  titleKey: TKey;
  href: string;
  icon: TIcon;
  /** Optional permission gating this item (see `filterNavByPermission`). */
  permission?: string;
  children?: ReadonlyArray<{ titleKey: TKey; href: string }>;
}

export interface NavGroup<TIcon = unknown, TKey extends string = string> {
  labelKey: TKey;
  items: NavItem<TIcon, TKey>[];
}

/**
 * Keep only the items the user may see: those with no `permission`, or whose
 * permission `hasPermission` grants. Works on any item shape carrying an
 * optional `permission` (NavItem or a narrower app type).
 */
export function filterNavByPermission<T extends { permission?: string }>(
  items: readonly T[],
  hasPermission: (permission: string) => boolean
): T[] {
  return items.filter((item) => !item.permission || hasPermission(item.permission));
}
