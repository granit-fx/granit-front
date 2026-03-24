import { createTsupConfig } from '../../../tsup.preset';

export default createTsupConfig({
  external: [/^@granit\//, /^@opentelemetry\//],
});
