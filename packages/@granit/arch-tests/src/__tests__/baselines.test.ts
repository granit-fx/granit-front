import { describe, expect, it } from 'vitest';

import {
  AXIOS_ALLOWLIST,
  CONSOLE_ALLOWLIST,
  FETCH_ALLOWLIST,
  LOGGER_MULTI_INSTANCE_BASELINE,
  REACT_ECOSYSTEM_CORE_ALLOWLIST,
  RSC_PACKAGES,
  STORYBOOK_PAGE_BUDGET,
  UI_ROUTER_BASELINE,
  UI_STACK_BELOW_TIER_BASELINE,
  listPackages,
} from './helpers';

const LISTS: Readonly<Record<string, ReadonlyArray<string>>> = {
  FETCH_ALLOWLIST,
  AXIOS_ALLOWLIST,
  CONSOLE_ALLOWLIST,
  RSC_PACKAGES,
  REACT_ECOSYSTEM_CORE_ALLOWLIST,
  UI_ROUTER_BASELINE,
  UI_STACK_BELOW_TIER_BASELINE,
  LOGGER_MULTI_INSTANCE_BASELINE,
  STORYBOOK_PAGE_BUDGET_KEYS: Object.keys(STORYBOOK_PAGE_BUDGET),
};

describe('baseline hygiene', () => {
  const known = new Set(listPackages().map((p) => p.name));

  // A renamed or deleted package would otherwise persist in an allowlist or
  // ratchet baseline as a dead entry, silently widening what the rule permits.
  it('every allowlist / ratchet entry refers to an existing package', () => {
    const stale = Object.entries(LISTS).flatMap(([list, names]) =>
      names.filter((name) => !known.has(name)).map((name) => `${list}: ${name}`)
    );
    expect(stale).toEqual([]);
  });

  it('no list contains duplicate entries', () => {
    const duplicated = Object.entries(LISTS).flatMap(([list, names]) =>
      names.filter((name, i) => names.indexOf(name) !== i).map((name) => `${list}: ${name}`)
    );
    expect(duplicated).toEqual([]);
  });
});
