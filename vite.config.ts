/**
 * Vite config for development tooling (vitest).
 * granit-front is a library workspace — there is no app build.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { granitWorkspaceAliases } from './scripts/workspace-aliases';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Auto-discovered from every package's `exports` map — see
    // scripts/workspace-aliases.ts.
    alias: granitWorkspaceAliases(__dirname),
  },
});
