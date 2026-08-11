// ---------------------------------------------------------------------------
// @granit/react-ui-reference-data — form ⇄ API mapping
//
// `ReferenceDataForm` speaks form values: dates as `''`, no parent as `''`,
// metadata as an editable key/value list. The reference-data endpoints speak
// DTOs: `null` for absent, metadata as a record. These two functions are the
// only place that translation should live — every consuming page had its own
// identical copy before.
// ---------------------------------------------------------------------------

import { toISODateString } from '@granit/types';

import type {
  EditReferenceDataFormValues,
  ReferenceDataFormValues,
  ReferenceDataResponse,
} from './types';
import type { ISODateString } from '@granit/types';

/** The create/update DTO fields derived from a form submission. */
export interface ReferenceDataPayloadFields {
  readonly parentCode: string | null;
  readonly validFrom: ISODateString | null;
  readonly validTo: ISODateString | null;
  readonly metadata: Record<string, string> | null;
}

type PayloadOf<TValues> = Omit<TValues, keyof ReferenceDataPayloadFields> &
  ReferenceDataPayloadFields;

function toMetadataRecord(
  entries: ReferenceDataFormValues['metadata']
): Record<string, string> | null {
  const named = entries.filter((entry) => entry.key.trim() !== '');
  if (named.length === 0) return null;
  return Object.fromEntries(named.map((entry) => [entry.key, entry.value]));
}

function toNullableDate(value: string): ISODateString | null {
  return value ? toISODateString(value) : null;
}

/**
 * Convert submitted form values into the shape the create/update endpoints
 * accept. Blank parent, dates and metadata keys all collapse to `null`; any
 * field the caller's value type adds is carried through untouched.
 */
export function toReferenceDataPayload<
  TValues extends ReferenceDataFormValues | EditReferenceDataFormValues,
>(values: TValues): PayloadOf<TValues> {
  const { metadata, parentCode, validFrom, validTo, ...rest } = values;
  return {
    ...rest,
    parentCode: parentCode || null,
    validFrom: toNullableDate(validFrom),
    validTo: toNullableDate(validTo),
    metadata: toMetadataRecord(metadata),
  } as PayloadOf<TValues>;
}

/**
 * Convert a fetched entry into `ReferenceDataForm` default values — the inverse
 * of {@link toReferenceDataPayload}. Absent values become `''` so the inputs
 * stay controlled.
 */
export function toReferenceDataFormValues(
  entry: ReferenceDataResponse
): EditReferenceDataFormValues {
  return {
    labelEn: entry.labelEn,
    labelFr: entry.labelFr,
    labelNl: entry.labelNl,
    labelDe: entry.labelDe,
    sortOrder: entry.sortOrder,
    activated: entry.activated,
    validFrom: entry.validFrom ?? '',
    validTo: entry.validTo ?? '',
    parentCode: entry.parentCode ?? '',
    metadata: Object.entries(entry.metadata ?? {}).map(([key, value]) => ({ key, value })),
  };
}
