import { TemplateLifecycleStatus } from '@granit/templating';
import { toISODateString } from '@granit/types';

import type {
  TemplateCategory,
  TemplateDetail,
  TemplateListItem,
  TemplateRevisionId,
} from '@granit/templating';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const mockTemplateCategories: Mutable<TemplateCategory>[] = [
  {
    id: 'cat_01HZ9KQX0000000000001' as TemplateCategory['id'],
    name: 'Email',
    description: 'Email notification templates',
    icon: 'mail',
    sortOrder: 1,
    templateCount: 2,
  },
  {
    id: 'cat_01HZ9KQX0000000000002' as TemplateCategory['id'],
    name: 'Document',
    description: 'Document and report templates',
    icon: 'file-text',
    sortOrder: 2,
    templateCount: 1,
  },
];

// ---------------------------------------------------------------------------
// Internal mock structure
// ---------------------------------------------------------------------------

export interface MockTemplate {
  name: string;
  culture?: string;
  category?: string;
  layoutName?: string;
  content: string;
  mimeType: string;
  status: number;
  lastModifiedAt: string;
  lastModifiedBy: string;
  hasPublishedVersion: boolean;
}

export const mockTemplatesData: MockTemplate[] = [
  {
    name: 'Email.Welcome',
    culture: 'fr',
    category: 'Email',
    layoutName: 'Layout.Email',
    content: '<h1>Bienvenue {{ user.name }}</h1><p>Votre compte a été créé.</p>',
    mimeType: 'text/html',
    status: TemplateLifecycleStatus.Published,
    lastModifiedAt: '2026-01-15T10:30:00Z',
    lastModifiedBy: 'admin@granit-showcase.local',
    hasPublishedVersion: true,
  },
  {
    name: 'Email.ResetPassword',
    culture: 'fr',
    category: 'Email',
    layoutName: 'Layout.Email',
    content: '<h1>Réinitialisation du mot de passe</h1><p>Cliquez sur le lien: {{ reset_url }}</p>',
    mimeType: 'text/html',
    status: TemplateLifecycleStatus.Draft,
    lastModifiedAt: '2026-02-20T14:00:00Z',
    lastModifiedBy: 'admin@granit-showcase.local',
    hasPublishedVersion: false,
  },
  {
    name: 'Document.Invoice',
    category: 'Document',
    content: '<h1>Facture #{{ invoice.number }}</h1><p>Montant: {{ invoice.amount }}€</p>',
    mimeType: 'text/html',
    status: TemplateLifecycleStatus.Draft,
    lastModifiedAt: '2026-03-10T09:15:00Z',
    lastModifiedBy: 'admin@granit-showcase.local',
    hasPublishedVersion: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers — convert internal shape to API contract types
// ---------------------------------------------------------------------------

export function toTemplateListItem(t: MockTemplate): Mutable<TemplateListItem> {
  return {
    name: t.name,
    culture: t.culture,
    category: t.category,
    layoutName: t.layoutName ?? null,
    currentStatus: t.status as TemplateListItem['currentStatus'],
    mimeType: t.mimeType,
    lastModifiedAt: toISODateString(t.lastModifiedAt),
    lastModifiedBy: t.lastModifiedBy,
    hasPublishedVersion: t.hasPublishedVersion,
  };
}

export function toTemplateDetail(t: MockTemplate): Mutable<TemplateDetail> {
  const revision = {
    revisionId: `rev_${t.name.replaceAll('.', '_')}_1` as TemplateRevisionId,
    content: t.content,
    mimeType: t.mimeType,
    layoutName: t.layoutName ?? null,
    status: t.status as TemplateListItem['currentStatus'],
    createdAt: toISODateString(t.lastModifiedAt),
    createdBy: t.lastModifiedBy,
  };
  return {
    name: t.name,
    culture: t.culture,
    category: t.category,
    layoutName: t.layoutName ?? null,
    draft: t.status === TemplateLifecycleStatus.Draft ? revision : undefined,
    published: t.hasPublishedVersion
      ? {
          ...revision,
          status: TemplateLifecycleStatus.Published as TemplateListItem['currentStatus'],
        }
      : undefined,
  };
}
