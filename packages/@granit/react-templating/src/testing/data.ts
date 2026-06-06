import { TemplateLifecycleStatus } from '@granit/templating';
import { toISODateString } from '@granit/types';

import type {
  TemplateCategory,
  TemplateDetail,
  TemplateListItem,
  TemplateRevisionId,
  WorkflowLifecycleStatus,
} from '@granit/templating';
import type { Mutable } from '@granit/testing';

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

const STATUS_MAP: Record<number, WorkflowLifecycleStatus> = {
  [TemplateLifecycleStatus.Draft]: 'Draft',
  [TemplateLifecycleStatus.PendingReview]: 'PendingReview',
  [TemplateLifecycleStatus.Published]: 'Published',
  [TemplateLifecycleStatus.Archived]: 'Archived',
};

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
    culture: t.culture ?? null,
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
    status: STATUS_MAP[t.status] ?? 'Draft',
    createdAt: toISODateString(t.lastModifiedAt),
    createdBy: t.lastModifiedBy,
    publishedAt: null,
    publishedBy: null,
    concurrencyStamp: `stamp_${t.name.replaceAll('.', '_')}_1`,
  };
  return {
    name: t.name,
    culture: t.culture ?? null,
    layoutName: t.layoutName ?? null,
    draft: t.status === TemplateLifecycleStatus.Draft ? revision : null,
    published: t.hasPublishedVersion
      ? {
          ...revision,
          status: 'Published' as WorkflowLifecycleStatus,
          publishedAt: toISODateString(t.lastModifiedAt),
          publishedBy: t.lastModifiedBy,
        }
      : null,
  };
}
