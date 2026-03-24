import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  splitting: false,
  external: [/^@granit\//, 'vitest'],
});
