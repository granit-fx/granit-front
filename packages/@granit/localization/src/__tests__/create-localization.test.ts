import { describe, expect, it } from 'vitest';

import { createLocalization } from '../create-localization';

describe('createLocalization', () => {
  it('should return an i18next instance', () => {
    const i18n = createLocalization();
    expect(i18n).toBeDefined();
    expect(typeof i18n.t).toBe('function');
    expect(typeof i18n.changeLanguage).toBe('function');
  });

  it('should create an isolated instance (not the global singleton)', () => {
    const a = createLocalization();
    const b = createLocalization();
    expect(a).not.toBe(b);
  });

  it('should use "translation" as default namespace', () => {
    const i18n = createLocalization();
    expect(i18n.options.defaultNS).toBe('translation');
  });

  it('should accept a custom defaultNS', () => {
    const i18n = createLocalization({ defaultNS: 'common' });
    expect(i18n.options.defaultNS).toBe('common');
  });

  it('should disable escapeValue for React', () => {
    const i18n = createLocalization();
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  it('should initialize with empty resources', () => {
    const i18n = createLocalization();
    expect(i18n.options.resources).toEqual({});
  });

  it('should not set a language (lng) on init', () => {
    const i18n = createLocalization();
    // i18next sets language to undefined or empty when no lng is provided
    expect(i18n.options.lng).toBeUndefined();
  });
});
