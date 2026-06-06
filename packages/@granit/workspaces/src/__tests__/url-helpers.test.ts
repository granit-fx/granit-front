import { describe, expect, it } from 'vitest';

import {
  buildEntityUrl,
  buildWorkspaceUrl,
  parseEntityUrl,
  parseWorkspaceUrl,
} from '../url/url-helpers';

describe('buildWorkspaceUrl', () => {
  it('returns /w/{name} for a workspace root', () => {
    expect(buildWorkspaceUrl('CRM')).toBe('/w/CRM');
  });

  it('encodes dots and special characters in the workspace name', () => {
    expect(buildWorkspaceUrl('Granit.Showcase.CRM')).toBe('/w/Granit.Showcase.CRM');
    expect(buildWorkspaceUrl('My Workspace')).toBe('/w/My%20Workspace');
  });

  it('appends segments encoded individually', () => {
    expect(buildWorkspaceUrl('CRM', 'parties', '42')).toBe('/w/CRM/parties/42');
    expect(buildWorkspaceUrl('CRM', 'a/b')).toBe('/w/CRM/a%2Fb');
  });
});

describe('buildEntityUrl', () => {
  it('returns /entity/{id} with the id encoded', () => {
    expect(buildEntityUrl('abc')).toBe('/entity/abc');
    expect(buildEntityUrl('a/b')).toBe('/entity/a%2Fb');
  });
});

describe('parseWorkspaceUrl', () => {
  it('parses a workspace root', () => {
    expect(parseWorkspaceUrl('/w/CRM')).toEqual({ workspace: 'CRM', segments: [] });
  });

  it('decodes the workspace name and segments', () => {
    expect(parseWorkspaceUrl('/w/Granit.Showcase.CRM/parties/42')).toEqual({
      workspace: 'Granit.Showcase.CRM',
      segments: ['parties', '42'],
    });
    expect(parseWorkspaceUrl('/w/My%20Workspace')).toEqual({
      workspace: 'My Workspace',
      segments: [],
    });
  });

  it('returns null for unrelated pathnames', () => {
    expect(parseWorkspaceUrl('/entity/42')).toBeNull();
    expect(parseWorkspaceUrl('/dashboards')).toBeNull();
    expect(parseWorkspaceUrl('/w/')).toBeNull();
  });

  it('returns null when the workspace segment is empty (/w//segment)', () => {
    expect(parseWorkspaceUrl('/w//something')).toBeNull();
  });

  it('round-trips with buildWorkspaceUrl', () => {
    const built = buildWorkspaceUrl('Granit.Framework', 'system', 'users');
    expect(parseWorkspaceUrl(built)).toEqual({
      workspace: 'Granit.Framework',
      segments: ['system', 'users'],
    });
  });
});

describe('parseEntityUrl', () => {
  it('parses /entity/{id}', () => {
    expect(parseEntityUrl('/entity/abc-123')).toEqual({ id: 'abc-123' });
  });

  it('decodes the id', () => {
    expect(parseEntityUrl('/entity/a%2Fb')).toEqual({ id: 'a/b' });
  });

  it('returns null for malformed pathnames', () => {
    expect(parseEntityUrl('/entity/')).toBeNull();
    expect(parseEntityUrl('/entity/a/b')).toBeNull();
    expect(parseEntityUrl('/w/CRM')).toBeNull();
  });

  it('round-trips with buildEntityUrl', () => {
    const built = buildEntityUrl('8c6b1e10-0000-4000-8000-000000000001');
    expect(parseEntityUrl(built)).toEqual({
      id: '8c6b1e10-0000-4000-8000-000000000001',
    });
  });
});
