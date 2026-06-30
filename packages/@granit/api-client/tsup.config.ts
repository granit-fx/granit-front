import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  entry: ['src/index.ts'],
  splitting: false,
  external: [/^@granit\//, 'vitest'],
});
