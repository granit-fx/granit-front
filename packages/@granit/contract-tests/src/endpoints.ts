import * as ts from 'typescript';

/** A route/verb mismatch between the backend spec and the front `api/` functions. */
export interface EndpointViolation {
  /** `missing-endpoint` (spec route with no front fn) | `orphan-endpoint` (front call with no spec route). */
  rule: string;
  module: string;
  method: string;
  route: string;
  message: string;
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

interface Endpoint {
  method: string;
  /** Route relative to the module base, with every path param normalized to `{}`. */
  route: string;
}

const normalizeRoute = (route: string): string => route.replace(/\{[^}]+\}/g, '{}'); // NOSONAR S5852: [^}]+ and } are disjoint — no backtracking possible

// --- OpenAPI side ----------------------------------------------------------

export interface OpenApiPaths {
  paths?: Record<string, Record<string, unknown>>;
}

/**
 * Candidate module-base prefixes: every segment-aligned prefix shared by all
 * paths (stopping before any path param), longest-first, plus the empty base.
 * The front `basePath` may or may not include the resource segment, so we try
 * each candidate and keep the one that best aligns spec routes with front calls.
 */
function candidateBases(paths: readonly string[]): string[] {
  if (paths.length === 0) return [''];
  const split = paths.map((p) => p.split('/'));
  const first = split[0]!;
  let max = 0;
  for (; max < first.length; max++) {
    const seg = first[max]!;
    if (seg.includes('{')) break;
    if (!split.every((s) => s[max] === seg)) break;
  }
  const out: string[] = [];
  for (let i = max; i >= 1; i--) out.push(first.slice(0, i).join('/'));
  out.push('');
  return [...new Set(out)];
}

function specEndpoints(spec: OpenApiPaths, base: string): Endpoint[] {
  const out: Endpoint[] = [];
  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    const route = normalizeRoute(path.startsWith(base) ? path.slice(base.length) : path);
    for (const method of Object.keys(methods)) {
      if (HTTP_METHODS.has(method)) out.push({ method, route });
    }
  }
  return out;
}

// --- TypeScript side -------------------------------------------------------

/** Reconstruct the route a `client.METHOD(url)` call targets, relative to `basePath`. */
function extractRoute(arg: ts.Expression | undefined): string | undefined {
  if (!arg) return undefined;
  if (ts.isIdentifier(arg) && arg.text === 'basePath') return '';
  if (ts.isTemplateExpression(arg)) {
    if (arg.head.text !== '') return undefined;
    const [first, ...rest] = arg.templateSpans;
    if (!first || !ts.isIdentifier(first.expression) || first.expression.text !== 'basePath') {
      return undefined;
    }
    let route = first.literal.text;
    for (const span of rest) route += `{}${span.literal.text}`;
    return normalizeRoute(route);
  }
  return undefined;
}

function frontEndpoints(sources: ReadonlyArray<{ file: string; text: string }>): {
  endpoints: Endpoint[];
  unparseable: number;
} {
  const endpoints: Endpoint[] = [];
  let unparseable = 0;

  for (const { file, text } of sources) {
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    // `const url = \`${basePath}/…\`` then `client.post(url, …)` — resolve the local.
    const consts = new Map<string, ts.Expression>();
    const collect = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        consts.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, collect);
    };
    collect(sf);

    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'client'
      ) {
        const method = node.expression.name.text.toLowerCase();
        if (HTTP_METHODS.has(method)) {
          let arg = node.arguments[0];
          if (arg && ts.isIdentifier(arg) && arg.text !== 'basePath') {
            arg = consts.get(arg.text) ?? arg;
          }
          const route = extractRoute(arg);
          if (route === undefined) unparseable++;
          else endpoints.push({ method, route });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return { endpoints, unparseable };
}

// --- Oracle ----------------------------------------------------------------

const key = (e: Endpoint): string => `${e.method} ${e.route}`;

export interface EndpointOptions {
  /**
   * Normalized routes (relative to `basePath`, params as `{}`) served outside
   * `api/` — e.g. a query-engine list (`''`, `'/meta'`) or a streaming
   * (`adapter: 'fetch'`) endpoint. Skipped on both sides.
   */
  ignore?: readonly string[];
}

/**
 * Verify the module's `api/` functions mirror the backend's routes: every spec
 * `path`+`method` has a front `client.METHOD()` call at the same route, and
 * every parseable front call maps to a real endpoint. The module base is
 * auto-detected (the front `basePath` may or may not include the resource
 * segment). Returns one {@link EndpointViolation} per drift (missing or orphan).
 */
export function checkEndpointConformance(
  module: string,
  spec: OpenApiPaths,
  apiSources: ReadonlyArray<{ file: string; text: string }>,
  options: EndpointOptions = {}
): EndpointViolation[] {
  const ignore = new Set(options.ignore ?? []);
  const { endpoints: frontEps } = frontEndpoints(apiSources);
  const frontSet = new Set(frontEps.map(key));

  // Pick the base prefix that minimizes the spec/front symmetric difference.
  const bases = candidateBases(Object.keys(spec.paths ?? {}));
  let best: { specEps: Endpoint[]; diff: number } | undefined;
  for (const base of bases) {
    const specEps = specEndpoints(spec, base).filter((e) => !ignore.has(e.route));
    const specSet = new Set(specEps.map(key));
    const diff =
      specEps.filter((e) => !frontSet.has(key(e))).length +
      frontEps.filter((e) => !ignore.has(e.route) && !specSet.has(key(e))).length;
    if (!best || diff < best.diff) best = { specEps, diff };
    if (diff === 0) break;
  }

  const specEps = best?.specEps ?? [];
  const specSet = new Set(specEps.map(key));
  const seen = new Set<string>();
  const out: EndpointViolation[] = [];
  const push = (v: EndpointViolation): void => {
    const k = `${v.rule} ${v.method} ${v.route}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(v);
  };

  for (const e of specEps) {
    if (!frontSet.has(key(e))) {
      push({
        rule: 'missing-endpoint',
        module,
        method: e.method,
        route: e.route,
        message: `backend ${e.method.toUpperCase()} {basePath}${e.route} has no matching front api function`,
      });
    }
  }
  for (const e of frontEps) {
    if (!ignore.has(e.route) && !specSet.has(key(e))) {
      push({
        rule: 'orphan-endpoint',
        module,
        method: e.method,
        route: e.route,
        message: `front api call ${e.method.toUpperCase()} {basePath}${e.route} has no matching backend endpoint`,
      });
    }
  }
  return out;
}
