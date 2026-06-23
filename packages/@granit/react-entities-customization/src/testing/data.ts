import type {
  EntityCustomizationResponse,
  LayoutDelta,
  WorkspaceCustomizationResponse,
} from '@granit/entities-customization';
import type { SchemaField } from '../layout/apply-deltas';
import type { ISODateString } from '@granit/types';
import type { Mutable } from '@granit/testing';

/**
 * Schema fields for the `Quote` form layout, before any deltas apply.
 * Mirrors the shape the editors/`applyDeltas` tests inline.
 */
export const mockSchemaFields: Mutable<SchemaField>[] = [
  { name: 'name', label: 'Name', defaultGroup: 'general' },
  { name: 'amount', label: 'Amount', defaultGroup: 'pricing' },
  { name: 'currency', label: 'Currency', defaultGroup: 'pricing' },
  { name: 'internalNotes', label: 'Internal notes' },
];

/** A representative delta of each kind in the closed catalog (`reorder`/`regroup`/`hide`). */
export const mockLayoutDeltas: Mutable<LayoutDelta>[] = [
  { $type: 'reorder', fieldName: 'currency', beforeFieldName: 'amount', afterFieldName: null },
  { $type: 'regroup', fieldName: 'amount', groupKey: 'finance' },
  { $type: 'hide', fieldName: 'internalNotes' },
];

/** Mock response for `GET|PUT /entities/Quote/customization/FormDefault`. */
export const mockEntityCustomization: Mutable<EntityCustomizationResponse> = {
  id: 'cust-1',
  entityName: 'Quote',
  layoutKind: 'FormDefault',
  deltas: [{ $type: 'hide', fieldName: 'internalNotes' }],
};

/** Mock response for `GET|PUT /workspaces/sales/customization`. */
export const mockWorkspaceCustomization: Mutable<WorkspaceCustomizationResponse> = {
  workspaceName: 'sales',
  deltas: [{ $type: 'hide', fieldName: 'tile-pipeline' }],
  updatedAt: '2026-02-27T08:00:00Z' as ISODateString,
  updatedByUserId: 'user-001',
};
