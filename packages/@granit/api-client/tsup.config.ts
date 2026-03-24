import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  entry: ['src/index.ts', 'src/test-utils.ts'],
  splitting: false,
  external: [/^@granit\//, 'vitest'],
});
