/** Request body for `POST /identity/provider/users`. */
export type IdentityUserCreateRequest = {
  readonly username: string;
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly enabled: boolean;
  readonly temporaryPassword?: string;
};

/** Request body for `PUT /identity/provider/users/{userId}`. */
export type IdentityUserUpdateRequest = {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly metadata?: Readonly<Record<string, string | null>>;
};

/** Request body for `PATCH /identity/provider/users/{userId}/enabled`. */
export type IdentityUserSetEnabledRequest = {
  readonly enabled: boolean;
};

/** Request body for `POST /identity/provider/users/{userId}/password/temporary`. */
export type IdentitySetTemporaryPasswordRequest = {
  readonly password: string;
};
