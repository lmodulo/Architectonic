import { defineConfig } from 'vitest/config';
import { existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve TypeScript ESM imports: maps `.js` to `.ts` and directory index files
function tsEsmResolve(): Plugin {
  return {
    name: 'ts-esm-resolve',
    resolveId(id: string, importer: string | undefined) {
      if (!importer || !id.startsWith('.') || !id.endsWith('.js')) return;

      const dir  = dirname(importer.replace(/\?.*$/, ''));
      const base = id.slice(0, -3); // strip .js
      const abs  = resolve(dir, base);

      // 1. Try <path>.ts
      const asTs = abs + '.ts';
      if (existsSync(asTs)) return asTs;

      // 2. Try <path>/index.ts  (directory with index)
      const asIndex = join(abs, 'index.ts');
      if (existsSync(asIndex)) return asIndex;

      return null;
    },
  };
}

export default defineConfig({
  plugins: [tsEsmResolve()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 70, branches: 65, functions: 70, lines: 70 }
    }
  }
});
