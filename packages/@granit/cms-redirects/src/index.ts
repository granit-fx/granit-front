// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  CreateRedirectRequest,
  ListRedirectsParams,
  PagedResponse,
  RedirectResolveResponse,
  RedirectResponse,
  UpdateRedirectRequest,
} from './types/index';

// ─── API — Public renderer ────────────────────────────────────────────────────
export { resolveRedirect } from './api/redirects';

// ─── API — Admin ─────────────────────────────────────────────────────────────
export {
  createRedirect,
  deleteRedirect,
  listRedirects,
  updateRedirect,
} from './api/redirects-admin';
