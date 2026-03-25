// ---------------------------------------------------------------------------
// Saved views — mirrors Granit.QueryEngine.SavedViews DTOs (.NET)
// ---------------------------------------------------------------------------

/** Saved view summary returned by list endpoint. */
export interface SavedViewSummary {
  readonly id: string;
  readonly name: string;
  readonly isShared: boolean;
  readonly isDefault: boolean;
}

/** Request body for creating a saved view. */
export interface CreateSavedViewRequest {
  readonly name: string;
  readonly isShared: boolean;
  readonly isDefault: boolean;
  readonly filterJson?: string;
  readonly sortJson?: string;
  readonly groupByJson?: string;
  readonly visibleColumnsJson?: string;
}

/** Request body for updating a saved view. */
export interface UpdateSavedViewRequest {
  readonly name: string;
  readonly isShared: boolean;
  readonly filterJson?: string;
  readonly sortJson?: string;
  readonly groupByJson?: string;
  readonly visibleColumnsJson?: string;
}
