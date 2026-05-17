# Threat Models — Granit Front

Pre-built STRIDE threat models for the most critical Granit front-end
components. Used by the `/security` skill as starting points — adapt
based on actual code analysis.

---

## Trust Boundaries

```text
ZONE 1 — Untrusted (Open browser / Network)
├── 3rd-party scripts (CDN, analytics, ads)
├── Browser extensions (full DOM access)
├── Other tabs / iframes (same origin = full trust; cross origin = isolated)
├── Network MITM (defeated by HTTPS + HSTS)
└── User input (forms, URL, paste, drag-and-drop)

ZONE 2 — SPA Origin (Granit Front)
├── React component tree
├── React Query cache (in-memory)
├── localStorage / sessionStorage / IndexedDB
├── Service Worker / Cache API
├── Cookies (HttpOnly cookies opaque to JS, others readable)
└── @granit/* packages loaded as TS source via Vite

ZONE 3 — Edge / BFF
├── BFF (HttpOnly cookie session)
├── YARP / Reverse proxy
└── CORS / CSP / HSTS headers

ZONE 4 — Backend / IdP
├── API modules
├── Identity Provider (OIDC) — accessed via browser redirect
└── External services (called by backend, never directly by SPA)
```

The strongest threat is **code running inside the SPA origin** —
3rd-party JS, browser extensions, or injected XSS payloads — because
the Same-Origin Policy is the SPA's primary defense and is broken by
anything sharing the origin.

---

## TM-01: BFF Authentication Flow (SPA side)

**Data Flow:** SPA boot → `fetch /bff/session` → CSRF token in memory →
axios interceptor → BFF → backend. Login: SPA navigates to `/bff/login` →
BFF starts OIDC dance → IdP → BFF callback → HttpOnly cookie set → SPA
re-bootstraps.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Spoofing** | Attacker triggers login redirect to attacker-controlled IdP | SPA never sets the IdP URL — BFF does; SPA only navigates to `/bff/login` | Check `@granit/react-bff` login function |
| **Spoofing** | Attacker forges CSRF token | CSRF token retrieved over authenticated session and bound to user | Check `@granit/bff` bootstrap fetch |
| **Tampering** | Attacker modifies axios interceptor at runtime via XSS | Defeated only by preventing XSS in the first place (cf. TM-02) | Check XSS surface |
| **Repudiation** | User denies action performed in tab | Audit on BFF; trace ID propagated via `@granit/react-tracing` | Check trace propagation |
| **Info Disclosure** | Session cookie readable from JS | HttpOnly flag set by BFF; SPA does not read `document.cookie` for auth | Grep `document.cookie` |
| **Info Disclosure** | CSRF token logged | Logger templates do not reference token | Check `@granit/logger` templates |
| **DoS** | 401 → infinite refresh storm | Single in-flight refresh, max 1 retry per request | Check 401 interceptor |
| **EoP** | Cookie carried to attacker domain | `SameSite=Strict/Lax` + correct cookie domain on BFF | Check cookie posture (server-side, but document expectation) |

### Attack Tree: Token theft via XSS in SPA

```text
Goal: Steal user session via the SPA
├── [AND] Inject JS into SPA origin
│   ├── Stored XSS via user-generated content rendered with dangerouslySetInnerHTML
│   │   └── Mitigated by: sanitization + Trusted Types policy
│   ├── Stored XSS via i18n translation containing markup
│   │   └── Mitigated by: translation source trust + render-time escape
│   ├── Reflected XSS via URL hash/query rendered raw
│   │   └── Mitigated by: React's default text escaping
│   ├── Supply chain compromise (malicious npm package)
│   │   └── Mitigated by: pnpm-lock, audit, scoped publishers
│   └── Browser extension injecting code
│       └── User-side responsibility; defense in depth: CSP `report-only`
├── [OR] Exfiltrate session cookie
│   ├── document.cookie (defeated by HttpOnly)
│   ├── Force fetch with credentials to attacker origin (defeated by CORS + SameSite)
│   └── Force user navigation carrying SameSite=Lax cookie
│       └── Mitigated by: SameSite=Strict for sensitive endpoints
├── [OR] Hijack in-memory token
│   ├── Read JS heap (defeated only by minimizing token lifetime)
│   └── Override axios instance to leak requests
│       └── No defense post-XSS; preventing XSS is the only real fix
└── [OR] Perform actions silently
    ├── Fire requests via existing axios instance (succeeds — CSRF + cookie ride along)
    │   └── Mitigated by: server-side action confirmation for destructive ops
    └── Modify React tree to mislead user
        └── No defense post-XSS
```

**Lesson:** Once XSS lands, BFF's HttpOnly cookie protects the
*exfiltration* of the credential but NOT the *use* of the credential
in the user's browser. XSS prevention is paramount.

---

## TM-02: XSS via dangerouslySetInnerHTML / DOM sinks

**Data Flow:** Untrusted string (user input, API response, translation,
markdown source) → React component → `dangerouslySetInnerHTML` /
`innerHTML` → Browser parses as HTML → Script executes.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Tampering** | Attacker injects `<script>` or `<img onerror>` via stored content | Sanitizer with allowlist before render; Trusted Types policy | Grep `dangerouslySetInnerHTML` + sanitizer usage |
| **Tampering** | Attacker injects `<a href="javascript:...">` | URL scheme validation in link components | Check link helpers |
| **Tampering** | Attacker injects markup via i18n translation | Trust contributions; sanitize render or escape interpolations | Check `<Trans>` components |
| **Info Disclosure** | XSS exfiltrates DOM (passwords, session tokens) | Prevent XSS; HttpOnly cookies; CSP `connect-src` allowlist | Document CSP expectations |
| **EoP** | XSS calls existing axios with user credentials | No defense post-XSS; user-confirm for destructive ops | Check destructive flow confirmations |

### Attack Tree: DOM XSS

```text
Goal: Execute attacker-controlled JS in SPA origin
├── [OR] HTML injection via dangerouslySetInnerHTML
│   ├── User-controlled API response rendered as HTML
│   │   └── Check: sanitizer applied? Allowlist?
│   ├── Markdown-to-HTML pipeline without sanitizer
│   │   └── Check: which lib? rehype-sanitize / DOMPurify?
│   └── i18n translation interpolating raw values into HTML
│       └── Check: <Trans> components, ICU MessageFormat usage
├── [OR] URL-based injection
│   ├── <a href={userValue}> with `javascript:` scheme
│   │   └── Check: scheme allowlist helper
│   └── <iframe src={userValue}> with `data:` scheme
│       └── Check: same
├── [OR] DOM API direct write
│   ├── element.innerHTML = userValue (via ref)
│   │   └── Check: grep ref.current.innerHTML
│   └── document.write
│       └── Check: grep document.write
└── [OR] Code execution sink
    ├── eval(userValue)
    │   └── Check: grep eval
    ├── new Function(userValue)
    │   └── Check: grep "new Function"
    └── setTimeout(userValue, ...)  # string form
        └── Check: grep setTimeout with string arg
```

---

## TM-03: Cross-Tenant Data Leak via React Query Cache

**Data Flow:** User in tenant A queries `useFoo()` → React Query cache
keyed by `['foo']` → User switches to tenant B → Cache HIT returns
tenant A data → UI displays tenant A data under tenant B context.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Info Disclosure** | Cache key omits tenant ID — cross-tenant HIT | All query keys include `tenantId`; helper enforces it | Grep `queryKey` definitions in `hooks/` |
| **Info Disclosure** | `queryClient.setQueryData` from untrusted handler | Restrict mutators to trusted update flows | Grep `setQueryData` |
| **Info Disclosure** | Stale data persisted in localStorage persister | Persister scoped per tenant; cleared on switch | Check `@tanstack/react-query-persist-client` config |
| **Tampering** | User-controlled URL becomes part of query key — cache poisoning | Sanitize and bound query key segments | Check key factories |
| **DoS** | Unbounded `staleTime`/`gcTime` retains gigabytes of data | Configure sensible defaults; per-query overrides justified | Check defaults |

### Attack Tree: Cross-Tenant Leak

```text
Goal: User in tenant B sees tenant A data
├── [OR] Cache key omits tenant
│   ├── Hook hardcodes ['entity', id]
│   │   └── Check: every key factory references current tenant
│   └── Key factory reads tenant from wrong source (props vs context)
│       └── Check: single source of truth (context provider)
├── [OR] Tenant switch does not invalidate
│   ├── No queryClient.clear() on switch
│   │   └── Check: tenant switch handler
│   └── Partial invalidation misses some keys
│       └── Check: invalidation predicate
└── [OR] Persisted cache survives logout
    ├── localStorage persister not cleared
    │   └── Check: logout flow clears persister
    └── IndexedDB cache not cleared
        └── Check: same
```

---

## TM-04: Supply Chain — Malicious npm Package

**Data Flow:** Developer adds dependency → `pnpm install` → postinstall
script executes OR malicious code is bundled by Vite → ships to
production → runs in every user's browser with full SPA origin trust.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Tampering** | Compromised package version published by attacker | Lockfile pinning, version review on update | `pnpm-lock.yaml`, Renovate policy |
| **Tampering** | Typosquat (e.g. `react-quary` instead of `react-query`) | Code review on new deps | PR reviewers |
| **Tampering** | `postinstall` script exfiltrates env / SSH keys | `ignore-scripts=true` in CI; review on dev | `.npmrc`, CI config |
| **Info Disclosure** | Malicious package reads `document.cookie` (defeated by HttpOnly), localStorage, intercepts fetch | Minimize 3rd-party deps; vet trust | Dep audit |
| **EoP** | Package adds a backdoor login bypass to auth flow | Review auth-related deps especially carefully | Pin auth lib versions |

### Attack Tree: Supply Chain Compromise

```text
Goal: Execute attacker code in every user browser
├── [OR] Direct dependency compromise
│   ├── Maintainer account takeover (npm)
│   │   └── Mitigated by: pinning + manual review on update
│   └── Malicious version pushed by legitimate maintainer
│       └── Mitigated by: lockfile + delayed updates + audit
├── [OR] Transitive dependency compromise
│   ├── Deep transitive lib injected into bundle
│   │   └── Mitigated by: tree-shaking + bundle analysis
│   └── Postinstall script in transitive dep
│       └── Mitigated by: ignore-scripts=true in CI
├── [OR] Typosquat
│   ├── New dep added with misspelled name
│   │   └── Mitigated by: code review checklist
└── [OR] Source code compromise (GitHub)
    ├── Malicious PR merged
    │   └── Mitigated by: branch protection, mandatory review
    └── Compromised CI runner publishing tampered release
        └── Mitigated by: provenance (sigstore, npm provenance)
```

---

## TM-05: MCP Client / AI Tool Output Rendering

**Data Flow:** User prompt → AI model → MCP tool call → Tool result
(text/HTML/markdown) → SPA renders in chat UI → If rendered as HTML
without sanitization → DOM XSS.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Tampering** | Tool returns HTML with `<script>` | Render as text by default; sanitize when rendering HTML | Check chat output renderer |
| **Tampering** | Tool returns markdown link with `javascript:` | Scheme allowlist on markdown links | Check markdown sanitizer |
| **Tampering** | Tool description contains attacker-controlled hidden instruction → LLM follows it (prompt injection) | UI shows raw tool description; user reviews; LLM hardened with system prompt | Check tool registration flow |
| **Info Disclosure** | Tool output streams PII into chat history persisted in localStorage | Mask sensitive fields; opt-in for persisting AI history | Check persistence |
| **EoP** | UI auto-runs suggested tool action (e.g. "delete") | Always require explicit user confirmation for destructive ops | Check tool execution gate |
| **EoP** | MCP server URL points to attacker → leaks user prompts/cookies | URL allowlist; no credentials forwarded to external MCP servers | Check connection config |

### Attack Tree: XSS via AI Tool Output

```text
Goal: Land XSS via the AI surface
├── [OR] Direct HTML injection
│   ├── Tool returns raw HTML, UI renders with dangerouslySetInnerHTML
│   │   └── Check: renderer uses text or sanitized HTML
│   └── Tool returns markdown with HTML pass-through
│       └── Check: markdown renderer config
├── [OR] Indirect via prompt injection
│   ├── User-controlled prompt convinces LLM to emit XSS payload
│   │   └── Check: output rendering safety (even if LLM outputs <script>, it should not execute)
│   └── External document via RAG contains XSS payload
│       └── Check: same — output rendering decides
└── [OR] Link injection
    ├── Tool returns <a href="javascript:..."> via markdown
    │   └── Check: scheme allowlist
    └── Tool returns auto-redirecting iframe
        └── Check: iframes blocked or sandboxed
```

---

## TM-06: OIDC SPA Flow (when no BFF available)

**Data Flow:** SPA initiates auth → redirect to IdP with PKCE challenge →
user authenticates → IdP redirects back with code → SPA exchanges code
for tokens → SPA stores tokens.

Use ONLY when a BFF is not available. The BFF pattern is preferred.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Spoofing** | Authorization code interception (no PKCE) | Mandatory PKCE with S256 | Check OIDC client config |
| **Tampering** | `redirect_uri` manipulated to attacker domain | IdP enforces allowlist; SPA uses static URI | Check `redirect_uri` literal |
| **Tampering** | `state` parameter not validated → CSRF on callback | `state` is random + session-bound + validated | Check state handler |
| **Tampering** | `nonce` not validated → token replay | `nonce` random + validated against ID token claim | Check nonce flow |
| **Info Disclosure** | Tokens in `localStorage` (readable by XSS) | Use in-memory only OR move to BFF | Grep `localStorage.setItem.*token` |
| **Info Disclosure** | Tokens leak via URL referrer | Tokens never in URL; `Referrer-Policy: no-referrer` | Check policy expectations |
| **EoP** | Token reused after logout | Backend revocation; SPA discards on logout | Check logout flow |

---

## TM-07: Browser Storage of Sensitive Data

**Data Flow:** Hook reads sensitive data from API → writes to
`localStorage` for offline / quick reload → next tab boot reads it →
3rd-party script in same origin reads it → exfiltrates.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Info Disclosure** | Tokens in `localStorage` | Never — use HttpOnly cookies via BFF | Grep |
| **Info Disclosure** | PII (emails, names) in `localStorage` | Avoid; if necessary, scope per session and clear on logout | Grep |
| **Info Disclosure** | Sensitive React Query cache persisted unencrypted | Per-query opt-in for persistence; never persist PII | Check persister config |
| **Tampering** | Attacker modifies `localStorage` → SPA reads tampered config → privilege escalation in UI | Treat storage as untrusted input; validate with Zod on read | Check read paths |
| **DoS** | Storage quota exhaustion fills `localStorage` | Bounded size, eviction policy | Check storage write helpers |

---

## TM-08: Form & File Upload

**Data Flow:** User fills form → Zod client validation → axios POST →
BFF → backend. File upload: `<input type="file">` → FormData → axios.

### STRIDE Analysis

| Threat | Vector | Mitigation (expected) | Verify |
|--------|--------|----------------------|--------|
| **Tampering** | User bypasses `disabled` field via DevTools | Server re-validates business rules | Treat client as untrusted |
| **Tampering** | User submits XSS-laden text — stored, then rendered raw elsewhere | Output sanitization on render (cf. TM-02) | Check render path |
| **DoS** | User uploads multi-GB file | Client-side size check + server enforcement | Check upload helper |
| **Info Disclosure** | Form auto-save persists draft with PII to `localStorage` | Auto-save scoped + cleared on submit/leave | Check auto-save |
| **EoP** | Hidden form field carries `role=admin` — naive backends trust it | Server reads role from session, never from form | Treat client as untrusted |

---

## Methodology Notes

### Using these threat models

1. **Start with the relevant TM** for the domain being audited.
2. **Verify each mitigation** exists in the actual code.
3. **Follow attack trees** to find gaps.
4. **Score findings** with CVSS 3.1.
5. **Check compensating controls** before assigning final severity.
6. **Update the TM** if new attack vectors are discovered.

### Revision triggers — when to revisit a threat model

| Change | Affected TMs | Why |
|--------|-------------|-----|
| New authentication provider (`@granit/authentication-<x>`) | TM-01, TM-06 | New trust boundary, token format |
| BFF replaced by direct SPA-to-API | TM-01, TM-06 | Token storage moves to browser |
| New rich-text / markdown renderer | TM-02, TM-05 | New DOM sinks |
| React Query upgrade or new persister | TM-03, TM-07 | Cache key semantics may change |
| New direct dependency in `package.json` | TM-04 | Supply chain expanded |
| MCP transport changes (stdio → HTTP) | TM-05 | New network surface |
| New IdP added | TM-06 | New redirect target |
| New offline-first feature (Service Worker, IndexedDB) | TM-07 | Storage attack surface grows |
| Form library swap (Formik → react-hook-form, etc.) | TM-08 | Validation pipeline changes |

**Rule:** Any PR that modifies a trust boundary crossing should reference
the relevant TM and confirm mitigations still hold.

### CVSS 3.1 Quick Reference

| Metric | Values |
|--------|--------|
| Attack Vector (AV) | Network (N), Adjacent (A), Local (L), Physical (P) |
| Attack Complexity (AC) | Low (L), High (H) |
| Privileges Required (PR) | None (N), Low (L), High (H) |
| User Interaction (UI) | None (N), Required (R) |
| Scope (S) | Unchanged (U), Changed (C) |
| Confidentiality (C) | None (N), Low (L), High (H) |
| Integrity (I) | None (N), Low (L), High (H) |
| Availability (A) | None (N), Low (L), High (H) |

Example: stored XSS in SPA →
`CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:L` ≈ 8.7 (High).

For browser-side findings, common patterns:

- **Stored XSS** — typically High to Critical (`UI:R` if user must view).
- **Token in localStorage** — High (CWE-922) — XSS escalates impact.
- **CSRF when CSRF token missing** — High (`PR:N/UI:R`).
- **Cross-tenant cache leak** — High to Critical depending on data sensitivity.
- **Supply chain compromise** — Critical (`AV:N/PR:N/UI:N/S:C/C:H/I:H/A:H`).
