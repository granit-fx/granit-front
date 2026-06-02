// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  CreateRedirectRequest,
  PagedResponse,
  RedirectResolveResponse,
  RedirectResponse,
  UpdateRedirectRequest,
} from './types/index.js';

// ─── API — Public renderer ────────────────────────────────────────────────────
export { resolveRedirect } from './api/redirects.js';

// ─── API — Admin ─────────────────────────────────────────────────────────────
export {
  createRedirect,
  deleteRedirect,
  listRedirects,
  updateRedirect,
} from './api/redirects-admin.js';
export type { ListRedirectsParams } from './api/redirects-admin.js';
