import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  entry: ['src/index.ts'],
  external: [/^@granit\//, 'react'],
});
