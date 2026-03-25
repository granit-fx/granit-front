/**
 * Confidence level for an automatic column mapping suggestion.
 * Mirrors `Granit.DataExchange.Import.MappingConfidence`.
 */
export type MappingConfidence = 'Manual' | 'Saved' | 'Exact' | 'Fuzzy' | 'Semantic';

/**
 * Mapping between a source file column and a target entity property.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.ColumnMappingDto`.
 */
export interface ImportColumnMapping {
  readonly sourceColumn: string;
  readonly targetProperty: string | null;
  readonly confidence: MappingConfidence;
}

/**
 * Metadata about a target field for import mapping.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.FieldMetadataDto`.
 */
export interface ImportFieldMetadata {
  readonly propertyPath: string;
  readonly clrTypeName: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly isRequired: boolean;
}

/**
 * Preview result after parsing the uploaded file.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.ImportPreviewResponse`.
 */
export interface ImportPreviewResponse {
  readonly headers: readonly string[];
  readonly previewRows: readonly (readonly string[])[];
  readonly suggestions: readonly ImportColumnMapping[];
  readonly fieldMetadata: readonly ImportFieldMetadata[];
}

/**
 * Request DTO for confirming column mappings.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.ConfirmMappingsRequest`.
 */
export interface ConfirmMappingsRequest {
  readonly mappings: readonly ImportColumnMapping[];
  /** When true, saves these mappings for reuse in future imports. */
  readonly saveForReuse?: boolean;
}
