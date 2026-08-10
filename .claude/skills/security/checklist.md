# Security Audit Checklist — Granit Front

Detailed verification matrix used by the `/security` skill. Each section maps
to a `<domain>` keyword. Apply methodically — check each item, note evidence.

Standards referenced:

- **ASVS** — OWASP Application Security Verification Standard 4.0
- **Top10** — OWASP Top 10 Web (2021)
- **API** — OWASP API Security Top 10 (2023)
- **LLM** — OWASP LLM Top 10 (2025)
- **RFC** — IETF RFCs (6749 OAuth2, 7636 PKCE, 6265 Cookies, etc.)
- **CSP** — W3C Content Security Policy Level 3
- **TT** — W3C Trusted Types
- **CWE** — Common Weakness Enumeration

---

## 1. Identity & Access Management (`iam`)

### 1a. BFF client — `@granit/bff`, `@granit/react-bff`

| #   | Check                                                                                                         | Standard   | Severity if missing |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------- | ------------------- |
| 1.1 | Session bootstrap (`fetch`) targets a same-origin or pinned BFF URL — no `window.location.origin` shenanigans | ASVS 9.2.1 | HIGH                |
| 1.2 | CSRF token retrieved at bootstrap is stored in memory only (NOT in `localStorage`)                            | CWE-352    | CRITICAL            |
| 1.3 | CSRF token piped into axios via interceptor for unsafe methods (POST/PUT/PATCH/DELETE)                        | ASVS 4.2.2 | HIGH                |
| 1.4 | `credentials: 'include'` only on BFF origin requests                                                          | CWE-942    | HIGH                |
| 1.5 | Back-channel logout endpoint clears local React Query cache + provider state                                  | ASVS 3.3.3 | HIGH                |
| 1.6 | Silent token refresh serialized via mutex (no concurrent refresh storms)                                      | CWE-362    | MEDIUM              |
| 1.7 | 401 response triggers ONE refresh attempt, then logs out (no infinite loop)                                   | CWE-835    | HIGH                |
| 1.8 | `withCredentials: true` defaults are restricted to the BFF axios instance                                     | CWE-942    | HIGH                |

### 1b. OIDC SPA flow (when no BFF)

| #    | Check                                                                                 | Standard        | Severity if missing |
| ---- | ------------------------------------------------------------------------------------- | --------------- | ------------------- |
| 1.9  | PKCE mandatory with `S256` (never `plain`)                                            | RFC 7636        | CRITICAL            |
| 1.10 | `state` parameter cryptographically random, single-use, session-bound                 | RFC 6749 §10.12 | CRITICAL            |
| 1.11 | `nonce` claim validated against session value                                         | OIDC §15.5.2    | HIGH                |
| 1.12 | `redirect_uri` is a constant or from a static allowlist — never built from user input | CWE-601         | CRITICAL            |
| 1.13 | Authorization code consumed once then removed from URL (`history.replaceState`)       | CWE-598         | HIGH                |
| 1.14 | Token endpoint NEVER called from SPA when a BFF is available                          | OAuth2 BCP      | HIGH                |
| 1.15 | `id_token` signature verified (JWKS) before trusting any claim                        | RFC 7519        | CRITICAL            |
| 1.16 | Token expiration enforced client-side (UX) AND server-side (authority)                | ASVS 3.5.3      | MEDIUM              |

### 1c. Token storage

| #    | Check                                                                                       | Standard         | Severity if missing |
| ---- | ------------------------------------------------------------------------------------------- | ---------------- | ------------------- |
| 1.17 | Access/refresh tokens NEVER persisted in `localStorage` / `sessionStorage` / `IndexedDB`    | OWASP ASVS 3.5.3 | CRITICAL            |
| 1.18 | Tokens in cookies require `HttpOnly`, `Secure`, `SameSite=Strict/Lax` (set by BFF, not SPA) | RFC 6265bis      | CRITICAL            |
| 1.19 | In-memory tokens flushed on `pagehide` / `beforeunload`                                     | ASVS 3.3.4       | LOW                 |
| 1.20 | Tokens never logged (logger templates do not interpolate them)                              | CWE-532          | CRITICAL            |
| 1.21 | Tokens never appear in URL query strings                                                    | ASVS 3.1.1       | HIGH                |

### 1d. API key auth — `@granit/authentication-api-keys`

| #    | Check                                                                          | Standard | Severity if missing |
| ---- | ------------------------------------------------------------------------------ | -------- | ------------------- |
| 1.22 | The package does NOT ship user-bearing API keys in the SPA bundle              | CWE-798  | CRITICAL            |
| 1.23 | If an API key flow exists, it's documented as service-to-service (not browser) | CWE-798  | HIGH                |

### 1e. Authorization

| #    | Check                                                                                   | Standard   | Severity if missing |
| ---- | --------------------------------------------------------------------------------------- | ---------- | ------------------- |
| 1.24 | Client-side permission checks are documented as UX hints only                           | Top10 A01  | HIGH                |
| 1.25 | No sensitive DTO is fetched and hidden by CSS (`display: none`) — server gates the data | Top10 A01  | CRITICAL            |
| 1.26 | Route guards delegate to server on first network call                                   | Top10 A01  | HIGH                |
| 1.27 | Permission cache (React Query) invalidated on logout / role change                      | ASVS 4.1.3 | MEDIUM              |
| 1.28 | Permission cache key includes user ID + tenant ID (no global cache)                     | CWE-639    | HIGH                |

---

## 2. XSS Surface (`xss`)

### 2a. DOM sinks

| #    | Check                                                                                            | Standard  | Severity if missing |
| ---- | ------------------------------------------------------------------------------------------------ | --------- | ------------------- |
| 2.1  | Every `dangerouslySetInnerHTML` is justified, sanitized (DOMPurify or equivalent), and commented | Top10 A03 | CRITICAL            |
| 2.2  | No `element.innerHTML = userValue` / `outerHTML = ...` / `insertAdjacentHTML`                    | CWE-79    | CRITICAL            |
| 2.3  | No `document.write` / `document.writeln`                                                         | CWE-79    | CRITICAL            |
| 2.4  | No `eval` / `new Function` / `setTimeout(string, ...)` / `setInterval(string, ...)`              | CWE-95    | CRITICAL            |
| 2.5  | No string-to-Function coercion through libs (`vm.runInNewContext` shims, etc.)                   | CWE-95    | HIGH                |
| 2.6  | URL injection: `<a href={userValue}>` validates scheme allowlist (https/http/mailto/tel)         | CWE-79    | HIGH                |
| 2.7  | `<img src>` / `<iframe src>` / `<video src>` validate scheme on user input                       | CWE-79    | HIGH                |
| 2.8  | `<iframe>` usage justified; `sandbox` attribute applied with minimum needed flags                | CWE-1021  | HIGH                |
| 2.9  | `target="_blank"` links carry `rel="noopener noreferrer"`                                        | CWE-1022  | MEDIUM              |
| 2.10 | `style={...}` does not interpolate user-controlled CSS values (CSS expressions, `url(...)`)      | CWE-79    | MEDIUM              |
| 2.11 | SVG content from untrusted source sanitized (no `<script>`, no `on*` attrs)                      | CWE-79    | HIGH                |
| 2.12 | Markdown rendering uses an allowlist sanitizer (no HTML pass-through by default)                 | CWE-79    | HIGH                |
| 2.13 | Trusted Types policy provided where DOM sinks are unavoidable                                    | TT        | MEDIUM              |
| 2.14 | No `postMessage` listener accepting messages from `*` origins                                    | CWE-345   | HIGH                |
| 2.15 | `postMessage` callers specify a precise target origin (never `*`)                                | CWE-345   | HIGH                |

### 2b. React-specific sinks

| #    | Check                                                                            | Standard | Severity if missing |
| ---- | -------------------------------------------------------------------------------- | -------- | ------------------- |
| 2.16 | No `{...userProps}` spread onto sensitive elements (`<a>`, `<form>`, `<script>`) | CWE-79   | HIGH                |
| 2.17 | `React.createElement(tag, ...)` does not accept `tag` from user input            | CWE-79   | HIGH                |
| 2.18 | `ref.current.innerHTML = ...` patterns absent                                    | CWE-79   | CRITICAL            |
| 2.19 | Hydration of SSR HTML happens with content from a trusted server only            | CWE-79   | HIGH                |

---

## 3. React Anti-patterns (`react`)

| #    | Check                                                                                          | Standard | Severity if missing |
| ---- | ---------------------------------------------------------------------------------------------- | -------- | ------------------- |
| 3.1  | Error boundaries render sanitized messages, not raw `error.message` / `error.stack`            | CWE-209  | MEDIUM              |
| 3.2  | Suspense fallbacks do not leak sensitive defaults                                              | CWE-200  | LOW                 |
| 3.3  | `useEffect` cleanup defined for subscriptions, event listeners, timers, EventSource, WebSocket | CWE-401  | MEDIUM              |
| 3.4  | No prop-drilling of raw tokens through context                                                 | CWE-200  | HIGH                |
| 3.5  | Lazy import paths are static (no `import(userInput)`)                                          | CWE-829  | HIGH                |
| 3.6  | `useImperativeHandle` does not expose raw DOM methods (`focus` OK, `innerHTML` not OK)         | CWE-79   | MEDIUM              |
| 3.7  | `useMemo` / `useCallback` deps include all referenced security-relevant values                 | CWE-841  | LOW                 |
| 3.8  | Refs to sensitive DOM nodes (password inputs) not exposed via context                          | CWE-200  | MEDIUM              |
| 3.9  | React DevTools build is disabled or limited in production                                      | CWE-200  | LOW                 |
| 3.10 | No reliance on `key={index}` for forms with sensitive data (state can leak across rows)        | CWE-664  | LOW                 |
| 3.11 | `Suspense` boundaries handle network failures without exposing internal URLs                   | CWE-200  | LOW                 |

---

## 4. API client & CSRF (`api`)

| #    | Check                                                                                           | Standard    | Severity if missing |
| ---- | ----------------------------------------------------------------------------------------------- | ----------- | ------------------- |
| 4.1  | All domain HTTP calls go through `@granit/api-client` (axios)                                   | CLAUDE.md   | HIGH                |
| 4.2  | `fetch(` usage restricted to the allowlist (BFF bootstrap, telemetry transports, SSE)           | CLAUDE.md   | HIGH                |
| 4.3  | Auth header / cookie injection happens in a request interceptor before retry/refresh            | ASVS 13.2.1 | HIGH                |
| 4.4  | CSRF token attached for unsafe methods                                                          | ASVS 4.2.2  | HIGH                |
| 4.5  | Tenant header (`X-Tenant-Id`) attached when tenant context is set                               | CWE-639     | HIGH                |
| 4.6  | Base URL is read from a typed config, not from `window.location` or user input                  | CWE-441     | MEDIUM              |
| 4.7  | Retries are bounded (max attempts + backoff) — no infinite retry on 5xx                         | CWE-400     | MEDIUM              |
| 4.8  | 401 handling does not log out on every transient failure (loops protected)                      | CWE-835     | MEDIUM              |
| 4.9  | Error responses NOT rendered raw into the UI (`error.response.data.message` sanitized)          | CWE-209     | MEDIUM              |
| 4.10 | Response shape validated with Zod on DTOs crossing trust boundaries                             | ASVS 5.1.3  | MEDIUM              |
| 4.11 | Streaming endpoints use axios `adapter: 'fetch'` + `responseType: 'stream'` (per CLAUDE.md)     | CLAUDE.md   | HIGH                |
| 4.12 | `Content-Type` header is `application/json` (or pinned) — not driven by user input              | CWE-20      | LOW                 |
| 4.13 | `XSRF-TOKEN` cookie read by axios uses default `withXSRFToken: true` posture (not custom regex) | ASVS 4.2.2  | MEDIUM              |

---

## 5. AI & MCP Client (`ai`)

### 5a. Tool output rendering

| #   | Check                                                                                   | Standard | Severity if missing |
| --- | --------------------------------------------------------------------------------------- | -------- | ------------------- |
| 5.1 | MCP tool responses rendered as TEXT by default; HTML rendering is opt-in and sanitized  | LLM02    | CRITICAL            |
| 5.2 | Markdown rendering of tool output uses allowlist sanitizer (no raw HTML)                | LLM02    | CRITICAL            |
| 5.3 | Hyperlinks in tool output validated against scheme allowlist (no `javascript:`/`data:`) | LLM02    | HIGH                |
| 5.4 | Images in tool output rendered with explicit width/height (no layout-shift abuse)       | LLM06    | LOW                 |
| 5.5 | Tool output containing PII flagged in UI (badge, masked by default)                     | LLM06    | MEDIUM              |

### 5b. Prompt injection at the UI

| #   | Check                                                                                   | Standard | Severity if missing |
| --- | --------------------------------------------------------------------------------------- | -------- | ------------------- |
| 5.6 | User input concatenated into prompts uses a clear delimiter / system message separation | LLM01    | HIGH                |
| 5.7 | Tool descriptions never interpolate user-controlled strings                             | LLM01    | HIGH                |
| 5.8 | UI does NOT auto-execute tool suggestions returned by the model                         | LLM08    | CRITICAL            |
| 5.9 | Tool invocation requires explicit user confirmation for destructive operations          | LLM08    | HIGH                |

### 5c. MCP client transport

| #    | Check                                                                              | Standard   | Severity if missing |
| ---- | ---------------------------------------------------------------------------------- | ---------- | ------------------- |
| 5.10 | MCP server URL validated against allowlist (no `localhost`, RFC 1918, `169.254.*`) | CWE-918    | CRITICAL            |
| 5.11 | MCP client does not forward user session cookies to 3rd-party MCP servers          | CWE-522    | CRITICAL            |
| 5.12 | MCP client connections have a bounded timeout (slowloris protection)               | CWE-400    | MEDIUM              |
| 5.13 | MCP transport scheme limited to `https:` (no `http:` in production builds)         | ASVS 9.1.1 | HIGH                |

---

## 6. Multi-Tenancy Isolation (`tenancy`)

| #   | Check                                                                            | Standard | Severity if missing |
| --- | -------------------------------------------------------------------------------- | -------- | ------------------- |
| 6.1 | Tenant header (`X-Tenant-Id`) attached on every domain API call via interceptor  | CWE-639  | CRITICAL            |
| 6.2 | React Query keys include `tenantId` for every tenant-scoped query                | CWE-639  | CRITICAL            |
| 6.3 | Tenant switch fires `queryClient.clear()` or scoped invalidation                 | CWE-639  | HIGH                |
| 6.4 | `localStorage` keys are tenant-prefixed when storing tenant-scoped data          | CWE-639  | HIGH                |
| 6.5 | Tenant in URL is the source of truth; routes guard mismatches                    | CWE-639  | HIGH                |
| 6.6 | Provider state resets on tenant change (no carry-over of permissions / settings) | CWE-639  | HIGH                |
| 6.7 | Background tasks (`setInterval`, `EventSource`) re-init on tenant switch         | CWE-639  | MEDIUM              |
| 6.8 | Notifications channels (SSE / WebSocket) re-subscribed with new tenant scope     | CWE-639  | HIGH                |

---

## 7. Browser Storage (`storage`)

| #    | Check                                                                                      | Standard     | Severity if missing |
| ---- | ------------------------------------------------------------------------------------------ | ------------ | ------------------- |
| 7.1  | No tokens (`access_token`, `id_token`, `refresh_token`) in `localStorage`/`sessionStorage` | ASVS 3.5.3   | CRITICAL            |
| 7.2  | No PII (emails, names, phone, addresses) in browser storage unencrypted                    | GDPR Art. 32 | HIGH                |
| 7.3  | No customer secrets (API keys, signing keys) in browser storage                            | CWE-798      | CRITICAL            |
| 7.4  | Storage keys are namespaced (`@granit/<pkg>:<tenant>:<key>`)                               | CWE-15       | LOW                 |
| 7.5  | Storage payloads have a schema version for safe upgrades                                   | CWE-20       | LOW                 |
| 7.6  | Storage is cleared on logout (`storage.clear()` or scoped removal)                         | ASVS 3.3.4   | HIGH                |
| 7.7  | `IndexedDB` databases versioned + tenant-scoped                                            | CWE-639      | MEDIUM              |
| 7.8  | Cookies set by SPA code carry `Secure` + `SameSite` (or, ideally, no SPA-set cookies)      | RFC 6265bis  | HIGH                |
| 7.9  | Service Worker caches do not store authenticated responses by default                      | CWE-525      | HIGH                |
| 7.10 | Background Sync does not replay sensitive POSTs indefinitely                               | CWE-400      | MEDIUM              |

---

## 8. Supply Chain (`supply-chain`)

| #    | Check                                                                                       | Standard   | Severity if missing |
| ---- | ------------------------------------------------------------------------------------------- | ---------- | ------------------- |
| 8.1  | `pnpm-lock.yaml` is committed and CI uses `--frozen-lockfile`                               | CWE-1357   | HIGH                |
| 8.2  | `pnpm audit --prod --json` returns no Critical/High vulnerabilities                         | CWE-1357   | CRITICAL            |
| 8.3  | No non-permissive licenses (GPL/LGPL/AGPL/SSPL) in shipped deps                             | Legal      | HIGH                |
| 8.4  | `THIRD-PARTY-NOTICES.md` matches current dependency tree                                    | Legal      | MEDIUM              |
| 8.5  | React, axios, react-query are pinned to exact versions                                      | CWE-1357   | MEDIUM              |
| 8.6  | New dependencies are reviewed for `postinstall` / `preinstall` scripts                      | CWE-506    | HIGH                |
| 8.7  | CI sets `npm_config_ignore_scripts=true` or equivalent for install steps                    | CWE-506    | MEDIUM              |
| 8.8  | Dependency names checked against typosquats (well-known packages)                           | CWE-1357   | MEDIUM              |
| 8.9  | Source generators / codegen tools pinned to exact versions                                  | CWE-1357   | MEDIUM              |
| 8.10 | No `<script src>` to 3rd-party CDNs without SRI `integrity` attribute                       | CWE-353    | HIGH                |
| 8.11 | Vite plugin list reviewed — no plugin executes arbitrary user-controlled code               | CWE-1357   | HIGH                |
| 8.12 | `package.json` `dependencies` vs `peerDependencies` posture per CLAUDE.md (peers, not deps) | Convention | LOW                 |
| 8.13 | Renovate/Dependabot configured to surface CVEs within 7 days                                | ISO A.8.8  | MEDIUM              |

---

## 9. Observability Security (`observability`)

### 9a. Logging

| #   | Check                                                                             | Standard    | Severity if missing |
| --- | --------------------------------------------------------------------------------- | ----------- | ------------------- |
| 9.1 | No PII (emails, names, phone, IPs) in log templates                               | GDPR Art. 5 | CRITICAL            |
| 9.2 | No tokens / secrets in log templates                                              | CWE-532     | CRITICAL            |
| 9.3 | `console.*` absent in `packages/@granit/` (CLAUDE.md rule) — use `@granit/logger` | Convention  | MEDIUM              |
| 9.4 | Logger redacts known sensitive fields (tokens, passwords) before transport        | GDPR Art. 5 | HIGH                |
| 9.5 | Log injection prevented (user input never directly used in template string)       | CWE-117     | MEDIUM              |
| 9.6 | Errors logged with sanitized stack traces (no internal API endpoints leaking)     | CWE-209     | MEDIUM              |

### 9b. Source maps

| #   | Check                                                                                     | Standard | Severity if missing |
| --- | ----------------------------------------------------------------------------------------- | -------- | ------------------- |
| 9.7 | Production builds do not emit publicly accessible `.map` files (or are access-controlled) | CWE-540  | HIGH                |
| 9.8 | If maps are uploaded to a crash service (Sentry), they are NOT served by the SPA origin   | CWE-540  | MEDIUM              |

### 9c. Telemetry transport

| #    | Check                                                                | Standard    | Severity if missing |
| ---- | -------------------------------------------------------------------- | ----------- | ------------------- |
| 9.9  | OTLP endpoint URL from typed config (not user input or query string) | CWE-441     | MEDIUM              |
| 9.10 | OTLP transport uses HTTPS in production                              | ASVS 9.1.1  | HIGH                |
| 9.11 | Span attributes do not contain PII or tokens                         | GDPR Art. 5 | HIGH                |
| 9.12 | W3C `traceparent` only propagated to first-party origins             | CWE-200     | MEDIUM              |
| 9.13 | Trace sampling does not encode user identifiers                      | GDPR Art. 5 | LOW                 |

---

## 10. CSP & Headers (`csp`)

The SPA is hosted by the BFF — most headers are server-set. The framework must
be COMPATIBLE with a strict CSP.

| #     | Check                                                                                               | Standard    | Severity if missing |
| ----- | --------------------------------------------------------------------------------------------------- | ----------- | ------------------- |
| 10.1  | No inline `<script>` blocks emitted (Vite/HTML entry verified)                                      | CSP §6.1    | HIGH                |
| 10.2  | No inline event handler attributes (`onclick="..."`) — use React event props                        | CSP §6.1    | HIGH                |
| 10.3  | No `eval` / `new Function` / `setTimeout(string, ...)` (matches §2.4)                               | CSP §6.1    | CRITICAL            |
| 10.4  | No inline `<style>` with user-controlled values                                                     | CSP §6.2    | MEDIUM              |
| 10.5  | `nonce` or `hash` strategy documented when inline content is unavoidable                            | CSP §6.1    | HIGH                |
| 10.6  | Trusted Types policy registered if framework writes to DOM sinks                                    | TT §2       | MEDIUM              |
| 10.7  | SRI `integrity` + `crossorigin="anonymous"` on dynamic `<script src>` injection                     | CWE-353     | HIGH                |
| 10.8  | CORS expectations documented: SPA does NOT set CORS headers — BFF does                              | CWE-942     | MEDIUM              |
| 10.9  | No use of `*` wildcard in any framework-emitted security header instruction                         | CWE-942     | HIGH                |
| 10.10 | `Permissions-Policy` features used by the SPA (camera, microphone, geolocation, ...) are documented | ASVS 14.4.6 | LOW                 |
| 10.11 | Framework code tolerates `frame-ancestors 'none'` — no embedding required                           | ASVS 14.4.7 | LOW                 |

---

## 11. Forms & Validation (`forms`)

| #     | Check                                                                                             | Standard    | Severity if missing |
| ----- | ------------------------------------------------------------------------------------------------- | ----------- | ------------------- |
| 11.1  | Every form input crossing the network has a Zod schema                                            | ASVS 5.1.3  | HIGH                |
| 11.2  | Server-side schema is the source of truth — client schema documented as UX layer                  | ASVS 5.1.4  | HIGH                |
| 11.3  | File upload: MIME + extension allowlist on the client                                             | ASVS 12.1.1 | MEDIUM              |
| 11.4  | File upload: max size enforced before submit                                                      | CWE-400     | MEDIUM              |
| 11.5  | File name sanitized for local display (no path traversal in download names)                       | CWE-22      | MEDIUM              |
| 11.6  | No `disabled` / `hidden` controls used as business-rule enforcement                               | Top10 A01   | HIGH                |
| 11.7  | CSRF token attached via axios interceptor (not manually wired in each form)                       | ASVS 4.2.2  | HIGH                |
| 11.8  | Form submission disables button to prevent double-submit (idempotency hint)                       | CWE-352     | LOW                 |
| 11.9  | Password inputs use `type="password"`, `autocomplete="current-password"` or `new-password`        | ASVS 2.7.5  | LOW                 |
| 11.10 | Sensitive fields use `autocomplete="off"` only where appropriate (do not break password managers) | ASVS 2.7.5  | LOW                 |

---

## 12. i18n Injection (`i18n`)

| #    | Check                                                                                      | Standard    | Severity if missing |
| ---- | ------------------------------------------------------------------------------------------ | ----------- | ------------------- |
| 12.1 | Translation source treated as trusted (committed in repo, reviewed) OR sanitized at render | Top10 A03   | HIGH                |
| 12.2 | `<Trans>` component or HTML-bearing translations apply sanitization                        | CWE-79      | HIGH                |
| 12.3 | Interpolated values are HTML-escaped before injection into translations with markup        | CWE-79      | HIGH                |
| 12.4 | Locale ID validated against a static allowlist (no dynamic import path traversal)          | CWE-22      | HIGH                |
| 12.5 | Locale switch does not reload sensitive data unnecessarily (no PII in URL on switch)       | GDPR Art. 5 | LOW                 |
| 12.6 | RTL/LTR direction set via `dir` attribute, not user input                                  | CWE-79      | LOW                 |

---

## 13. Cross-Cutting Concerns

These apply across all domains:

| #     | Check                                                                                                    | Standard    | Severity if missing |
| ----- | -------------------------------------------------------------------------------------------------------- | ----------- | ------------------- |
| 13.1  | No hardcoded secrets (tokens, API keys, signing keys) in source code                                     | CWE-798     | CRITICAL            |
| 13.2  | No `VITE_*` env var contains a secret (everything `VITE_*` ships to the browser)                         | CWE-798     | CRITICAL            |
| 13.3  | `.gitignore` excludes `.env`, `.env.local`, `*.pfx`, `*.key`, `*.pem`                                    | CWE-798     | HIGH                |
| 13.4  | All external HTTP calls use HTTPS in production builds                                                   | ASVS 9.1.1  | HIGH                |
| 13.5  | Request size / payload limits enforced (UX + early bandwidth save)                                       | CWE-400     | LOW                 |
| 13.6  | Error responses use a uniform shape; no internal stack traces shown to user                              | CWE-209     | MEDIUM              |
| 13.7  | TypeScript `strict` mode enabled in every package (CLAUDE.md)                                            | ASVS 14.2.1 | MEDIUM              |
| 13.8  | ESLint security plugin (or equivalent) runs in CI                                                        | ASVS 14.2.5 | MEDIUM              |
| 13.9  | `@granit/*` package public API (`src/index.ts`) does not re-export internals that would weaken isolation | Convention  | MEDIUM              |
| 13.10 | Test fixtures do not contain plausible-looking real secrets (use obvious placeholders)                   | CWE-798     | LOW                 |
