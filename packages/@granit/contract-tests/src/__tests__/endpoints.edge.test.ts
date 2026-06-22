import { describe, expect, it } from 'vitest';

import { checkEndpointConformance } from '../endpoints';

import type { OpenApiPaths } from '../endpoints';

// Edge-case coverage for the endpoint oracle — route extraction branches and the
// base-prefix auto-detection that the positive controls do not reach.

const file = '/virtual/api.ts';
const check = (spec: OpenApiPaths, src: string, opts?: { ignore?: readonly string[] }) =>
  checkEndpointConformance('mod', spec, [{ file, text: src }], opts);

describe('extractRoute — unparseable call forms', () => {
  it('ignores a client call whose URL template head is non-empty (not basePath-rooted)', () => {
    // head !== '' → extractRoute returns undefined → call is counted unparseable,
    // not pushed as an endpoint. Spec route then has no front match → missing.
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client, basePath) {
        return client.get(\`/api\${basePath}/widgets\`);
      }`;
    expect(check(spec, src)).toContainEqual(
      expect.objectContaining({ rule: 'missing-endpoint', method: 'get' })
    );
  });

  it('ignores a client call whose first template span is not basePath', () => {
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client, root) {
        return client.get(\`\${root}/widgets\`);
      }`;
    // No parseable front endpoints → spec route is missing.
    expect(check(spec, src)).toContainEqual(expect.objectContaining({ rule: 'missing-endpoint' }));
  });

  it('ignores a client call with a non-template, non-basePath string argument', () => {
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client) {
        return client.get('/widgets');
      }`;
    expect(check(spec, src)).toContainEqual(expect.objectContaining({ rule: 'missing-endpoint' }));
  });

  it('ignores a client call with no arguments at all', () => {
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client) {
        return client.get();
      }`;
    expect(check(spec, src)).toContainEqual(expect.objectContaining({ rule: 'missing-endpoint' }));
  });

  it('resolves the bare basePath identifier to the empty route', () => {
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client, basePath) {
        return client.get(basePath);
      }`;
    // Front route '' aligned to the '/widgets' base → empty diff, no violations.
    expect(check(spec, src)).toEqual([]);
  });

  it('handles a multi-span template (path param interpolation) producing {} placeholders', () => {
    const spec: OpenApiPaths = { paths: { '/widgets/{id}/parts/{pid}': { get: {} } } };
    const src = `
      export async function getPart(client, basePath, id, pid) {
        return client.get(\`\${basePath}/widgets/\${id}/parts/\${pid}\`);
      }`;
    expect(check(spec, src)).toEqual([]);
  });
});

describe('const-url resolution', () => {
  it('resolves a local const referencing basePath', () => {
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client, basePath) {
        const url = \`\${basePath}/widgets\`;
        return client.get(url);
      }`;
    expect(check(spec, src)).toEqual([]);
  });

  it('leaves an unresolvable const identifier unparseable (no false endpoint)', () => {
    // `url` is never declared as a const here, so consts.get returns undefined and
    // the identifier itself is passed through → extractRoute returns undefined.
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(client) {
        return client.get(url);
      }`;
    expect(check(spec, src)).toContainEqual(expect.objectContaining({ rule: 'missing-endpoint' }));
  });
});

describe('candidateBases & base auto-detection', () => {
  it('handles an empty spec with no paths (no violations, only orphans possible)', () => {
    const src = `
      export async function listWidgets(client, basePath) {
        return client.get(\`\${basePath}/widgets\`);
      }`;
    // No spec paths → candidateBases([]) === [''] → front call is an orphan.
    expect(check({}, src)).toContainEqual(
      expect.objectContaining({ rule: 'orphan-endpoint', route: '/widgets' })
    );
  });

  it('stops the shared prefix at a path parameter segment', () => {
    // All paths share '/widgets' then diverge at a param — base is '/widgets'.
    const spec: OpenApiPaths = {
      paths: {
        '/widgets/{id}': { get: {} },
        '/widgets/{id}/archive': { post: {} },
      },
    };
    const src = `
      export async function getWidget(client, basePath, id) {
        return client.get(\`\${basePath}/\${id}\`);
      }
      export async function archiveWidget(client, basePath, id) {
        return client.post(\`\${basePath}/\${id}/archive\`);
      }`;
    expect(check(spec, src)).toEqual([]);
  });

  it('breaks early when a candidate base yields a zero diff', () => {
    const spec: OpenApiPaths = {
      paths: { '/widgets': { get: {}, post: {} } },
    };
    const src = `
      export async function listWidgets(client, basePath) {
        return client.get(\`\${basePath}/widgets\`);
      }
      export async function createWidget(client, basePath, body) {
        return client.post(\`\${basePath}/widgets\`, body);
      }`;
    expect(check(spec, src)).toEqual([]);
  });

  it('ignores non-HTTP method keys in the spec path object', () => {
    const spec: OpenApiPaths = {
      paths: { '/widgets': { get: {}, parameters: {}, summary: {} } },
    };
    const src = `
      export async function listWidgets(client, basePath) {
        return client.get(\`\${basePath}/widgets\`);
      }`;
    expect(check(spec, src)).toEqual([]);
  });
});

describe('client-call filtering', () => {
  it('ignores property-access calls that are not on a `client` identifier', () => {
    const spec: OpenApiPaths = { paths: { '/widgets': { get: {} } } };
    const src = `
      export async function listWidgets(api, basePath) {
        return api.get(\`\${basePath}/widgets\`);
      }`;
    // api.get(...) is not client.* → no front endpoint extracted → spec missing.
    expect(check(spec, src)).toContainEqual(expect.objectContaining({ rule: 'missing-endpoint' }));
  });

  it('ignores client methods that are not HTTP verbs', () => {
    const spec: OpenApiPaths = { paths: {} };
    const src = `
      export async function setup(client) {
        return client.interceptors(\`x\`);
      }`;
    expect(check(spec, src)).toEqual([]);
  });

  it('deduplicates identical missing-endpoint violations', () => {
    // Two spec entries collapse to the same normalized route+method; the oracle's
    // `seen` set keeps a single violation.
    const spec: OpenApiPaths = {
      paths: {
        '/widgets/{id}': { get: {} },
        '/widgets/{name}': { get: {} },
      },
    };
    const src = 'export const noop = 1;';
    const violations = check(spec, src).filter((v) => v.rule === 'missing-endpoint');
    expect(violations).toHaveLength(1);
  });
});
