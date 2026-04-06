import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  entry: ['src/index.ts', 'src/testing/index.ts'],
  external: [/^@granit\//, 'msw'],
});
