// ---------------------------------------------------------------------------
// Admin group types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Group descriptor — mirrors `AdminGroupResponse`. */
export interface AdminGroup {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly tenantId: string | null;
}

/** Request body for `POST /groups`. */
export interface AdminGroupCreateRequest {
  readonly name: string;
  readonly description?: string;
}

/** Request body for `POST /groups/{groupId}/members`. */
export interface AdminGroupMemberRequest {
  readonly userId: string;
}
