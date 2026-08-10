/** Re-export the base entry type for convenience. */
export type { ReferenceDataResponse } from '@granit/reference-data';

/** Shared form values — superset with optional create-only code field. */
export interface ReferenceDataFormValues {
  labelEn: string;
  labelFr: string;
  labelNl: string;
  labelDe: string;
  sortOrder: number;
  activated: boolean;
  validFrom: string;
  validTo: string;
  parentCode: string;
  metadata: { key: string; value: string }[];
  code?: string;
}

export type CreateReferenceDataFormValues = ReferenceDataFormValues &
  Required<Pick<ReferenceDataFormValues, 'code'>>;

export type EditReferenceDataFormValues = Omit<ReferenceDataFormValues, 'code'>;
