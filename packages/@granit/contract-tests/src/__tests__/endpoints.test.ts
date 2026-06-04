import { describe, expect, it } from 'vitest';

import { checkEndpointConformance } from '../endpoints';

import type { OpenApiPaths } from '../endpoints';

const spec: OpenApiPaths = {
  paths: {
    '/widgets': { get: {}, post: {} },
    '/widgets/{id}': { get: {} },
    '/widgets/{id}/archive': { post: {} },
  },
};

const file = '/virtual/widgets-api.ts';
const check = (src: string) => checkEndpointConformance('widgets', spec, [{ file, text: src }]);

const GREEN = `
  export async function listWidgets(client, basePath) {
    return client.get(\`\${basePath}/widgets\`);
  }
  export async function createWidget(client, basePath, body) {
    return client.post(\`\${basePath}/widgets\`, body);
  }
  export async function getWidget(client, basePath, id) {
    return client.get(\`\${basePath}/widgets/\${encodeURIComponent(id)}\`);
  }
  export async function archiveWidget(client, basePath, id) {
    const url = \`\${basePath}/widgets/\${id}/archive\`;
    return client.post(url);
  }`;

describe('endpoint conformance — positive & negative controls', () => {
  it('passes when api/ routes mirror the spec (basePath auto-detected, const url resolved)', () => {
    expect(check(GREEN)).toEqual([]);
  });

  it('flags a missing endpoint (spec route with no front call)', () => {
    const src = GREEN.replace(/export async function archiveWidget[\s\S]*?\n {2}}/, '');
    expect(check(src)).toContainEqual(
      expect.objectContaining({
        rule: 'missing-endpoint',
        method: 'post',
        route: '/widgets/{}/archive',
      })
    );
  });

  it('flags an orphan endpoint (front call with no spec route)', () => {
    const src = `${GREEN}
      export async function deleteWidget(client, basePath, id) {
        return client.delete(\`\${basePath}/widgets/\${id}\`);
      }`;
    expect(check(src)).toContainEqual(
      expect.objectContaining({ rule: 'orphan-endpoint', method: 'delete', route: '/widgets/{}' })
    );
  });

  it('flags a verb mismatch as both missing and orphan', () => {
    const src = GREEN.replace('return client.post(url);', 'return client.get(url);');
    const v = check(src);
    expect(v).toContainEqual(
      expect.objectContaining({
        rule: 'missing-endpoint',
        method: 'post',
        route: '/widgets/{}/archive',
      })
    );
    expect(v).toContainEqual(
      expect.objectContaining({
        rule: 'orphan-endpoint',
        method: 'get',
        route: '/widgets/{}/archive',
      })
    );
  });

  it('respects the ignore list (query-engine surface routes)', () => {
    const listSpec: OpenApiPaths = {
      paths: {
        '/widgets': { get: {} }, // query-engine list — not a front api fn
        '/widgets/{id}': { get: {} },
      },
    };
    const src = `
      export async function getWidget(client, basePath, id) {
        return client.get(\`\${basePath}/widgets/\${encodeURIComponent(id)}\`);
      }`;
    expect(
      checkEndpointConformance('widgets', listSpec, [{ file, text: src }], { ignore: ['/widgets'] })
    ).toEqual([]);
  });
});
