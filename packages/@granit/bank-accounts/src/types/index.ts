import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

/**
 * Routing scheme of a bank account. Mirrors
 * `Granit.BankAccounts.Domain.BankAccountScheme` (serialized to its string name).
 *
 * `Iban` is self-contained (ISO 13616, no routing code); the domestic schemes
 * each carry their own routing code (`UsAch` → ABA, `CaEft` → transit,
 * `AuBsb` → BSB, `InIfsc` → IFSC). `Other` is the open-ended fallback.
 */
export type BankAccountScheme = 'Iban' | 'UsAch' | 'CaEft' | 'AuBsb' | 'InIfsc' | 'Other';

/** Lifecycle status of a bank account. `Archived` is a soft-delete (record retained). */
export type BankAccountStatus = 'Active' | 'Archived';

/** Account type. `Unknown` is the default when the caller does not classify the account. */
export type BankAccountType = 'Unknown' | 'Checking' | 'Savings';

/**
 * Registers a bank account for a party.
 *
 * Account-identifier and routing-code rules are scheme-aware (enforced
 * server-side): an `Iban` forbids a routing code, while each domestic scheme
 * requires its own. The `accountIdentifier` is encrypted at rest and never
 * returned in clear — responses expose {@link BankAccountResponse.accountIdentifierMasked}.
 */
export interface CreateBankAccountRequest {
  readonly partyId: string;
  readonly scheme: BankAccountScheme;
  /** IBAN or domestic account number (max 64 chars). Encrypted at rest. */
  readonly accountIdentifier: string;
  /** Account holder name (max 140 chars). */
  readonly holderName: string;
  /** ISO 3166-1 alpha-2 country code. */
  readonly countryCode: string;
  /** Domestic routing code (max 34 chars). Required for domestic schemes, forbidden for `Iban`. */
  readonly routingCode?: string | null;
  /** Bank/SWIFT BIC (max 11 chars). */
  readonly bic?: string | null;
  readonly accountType?: BankAccountType;
  /** Marks the account as trusted at creation. Defaults to `false`. */
  readonly trusted?: boolean;
  readonly bankName?: string | null;
  readonly bankAddress?: string | null;
  /** Intermediary/correspondent bank BIC (max 11 chars). */
  readonly intermediaryBic?: string | null;
  /** Free-text internal note (max 1000 chars). Never returned in responses. */
  readonly internalNote?: string | null;
}

/**
 * A bank account as returned by the CRUD endpoints, with the account identifier
 * masked (e.g. `**** 7034`). The clear identifier and the internal note are
 * never projected here.
 */
export interface BankAccountResponse {
  readonly id: string;
  readonly partyId: string;
  readonly scheme: BankAccountScheme;
  readonly accountType: BankAccountType;
  /** Masked account identifier (e.g. `**** 7034`). */
  readonly accountIdentifierMasked: string;
  readonly routingCode: string | null;
  readonly bic: string | null;
  readonly holderName: string;
  readonly countryCode: string;
  readonly bankName: string | null;
  readonly bankAddress: string | null;
  readonly intermediaryBic: string | null;
  readonly status: BankAccountStatus;
  readonly verified: boolean;
  readonly trusted: boolean;
  readonly tenantId: TenantId | null;
}

/**
 * Bank account entity as returned by the QueryEngine admin grid (`GET {basePath}`).
 *
 * Distinct from {@link BankAccountResponse}: the query endpoint returns the raw
 * audited entity including `tenantId` and audit columns. The encrypted
 * `accountIdentifier` is excluded from the query projection server-side, so it
 * is effectively never populated through this surface.
 */
export interface BankAccount {
  readonly partyId: string;
  readonly scheme: BankAccountScheme;
  readonly accountIdentifier: string;
  readonly routingCode: string | null;
  readonly bic: string | null;
  readonly holderName: string;
  readonly countryCode: string;
  readonly accountType: BankAccountType;
  readonly bankName: string | null;
  readonly bankAddress: string | null;
  readonly intermediaryBic: string | null;
  readonly internalNote: string | null;
  readonly status: BankAccountStatus;
  readonly verified: boolean;
  readonly trusted: boolean;
  readonly tenantId: TenantId | null;
  readonly modifiedAt: ISODateString | null;
  readonly modifiedBy: string | null;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly id: string;
}

/** Paginated page of {@link BankAccount} entities (QueryEngine admin grid). */
export type BankAccountPage = PagedResult<BankAccount>;

/** Query parameters accepted by the bank account QueryEngine grid (`GET {basePath}`). */
export type BankAccountListParams = QueryRequest;
