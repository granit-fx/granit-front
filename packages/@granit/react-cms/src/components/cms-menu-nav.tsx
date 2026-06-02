'use client';

import type { ResolvedMenu, ResolvedMenuItem } from '@granit/cms';

interface CmsMenuNavProps {
  readonly menu: ResolvedMenu;
  readonly className?: string;
}

/**
 * Renders a resolved CMS menu as a semantic `<nav>`.
 * Handles all four {@link import('@granit/cms').MenuTargetKind} values:
 * - `Page` / `ExternalUrl` / `Anchor` → `<a>` with the resolved href
 * - `None` → `<span>` grouping header (no link)
 */
export function CmsMenuNav({ menu, className }: CmsMenuNavProps) {
  return (
    <nav aria-label={menu.title} className={className}>
      <ul>
        {menu.items.map((item) => (
          <MenuItemNode key={item.label} item={item} />
        ))}
      </ul>
    </nav>
  );
}

function MenuItemNode({ item }: { readonly item: ResolvedMenuItem }) {
  const label =
    item.kind === 'None' || !item.href ? (
      <span className={item.cssClass ?? undefined}>{item.label}</span>
    ) : (
      <a
        href={item.href}
        className={item.cssClass ?? undefined}
        target={item.kind === 'ExternalUrl' ? '_blank' : undefined}
        rel={item.kind === 'ExternalUrl' ? 'noopener noreferrer' : undefined}
      >
        {item.label}
      </a>
    );

  return (
    <li>
      {label}
      {item.children.length > 0 && (
        <ul>
          {item.children.map((child) => (
            <MenuItemNode key={child.label} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
