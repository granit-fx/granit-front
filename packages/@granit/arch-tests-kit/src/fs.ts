import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  'storybook-static',
]);

function processWalkEntry(
  entry: fs.Dirent,
  cur: string,
  stack: string[],
  out: string[],
  filter: ((file: string) => boolean) | undefined
): void {
  const full = path.join(cur, entry.name);
  if (entry.isDirectory()) {
    if (!SKIP_DIRS.has(entry.name)) stack.push(full);
  } else if (entry.isFile()) {
    if (!/\.(ts|tsx)$/.test(entry.name)) return;
    if (filter && !filter(full)) return;
    out.push(full);
  }
}

export function walkSourceFiles(rootDir: string, filter?: (file: string) => boolean): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const out: string[] = [];
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === undefined) break;
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      processWalkEntry(entry, cur, stack, out, filter);
    }
  }
  return out;
}

export function isTestFile(file: string): boolean {
  return /(^|[\\/])__tests__[\\/]/.test(file) || /\.test\.tsx?$/.test(file);
}

export function isTestingDir(file: string): boolean {
  return /[\\/]testing[\\/]/.test(file) || /[\\/]testing\.tsx?$/.test(file);
}

export function rel(file: string, repoRoot: string): string {
  return path.relative(repoRoot, file);
}

export function readFile(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

/**
 * Drop // and /* ... *\/ comments and JSDoc * lines so a regex looking for a
 * runtime call doesn't false-positive on documented examples.
 */
export function stripComments(src: string): string {
  return (
    src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // NOSONAR: these regexes run only on bounded developer source files — no user input, no ReDoS risk
      .replace(/(^|\n)[ \t]*\*[^\n]*/g, '$1')
      .replace(/\/\/[^\n]*/g, '')
  );
}
