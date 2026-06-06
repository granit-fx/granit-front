import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  entry: ['src/index.ts', 'src/msw.ts', 'src/msw-server.ts'],
  splitting: false,
  external: [/^@granit\//, 'vitest', 'msw'],
});
