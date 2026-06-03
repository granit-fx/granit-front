'use client';

import { safeLinkHref } from '../lib/safe-href';

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
  // Editor-authored `ExternalUrl` items may carry a `javascript:` scheme —
  // drop the href and render an inert grouping header instead. See VULN-101.
  const safeHref = safeLinkHref(item.href);
  const label =
    item.kind === 'None' || !safeHref ? (
      <span className={item.cssClass ?? undefined}>{item.label}</span>
    ) : (
      <a
        href={safeHref}
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
