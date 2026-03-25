# Contributing to Granit Front

Thank you for your interest in contributing to Granit Front! This guide will help you
get started.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We are
committed to providing a welcoming and inclusive experience for everyone.

## Getting Started

### Prerequisites

- **Node.js 24** — `node --version` should return `v24.x`
- **pnpm 10** — `pnpm --version` should return `10.x`
- **Git** with SSH access

> **pnpm only** — never use npm or yarn.

### Setup

```bash
git clone <repository-url>
cd granit-front
pnpm install
```

### Build and test

```bash
# Lint — ESLint strict (zero warnings)
pnpm lint

# TypeScript check — all packages
pnpm tsc

# Tests — watch mode (development)
pnpm test

# Tests — single run with coverage (v8, lcov + html)
pnpm test:coverage

# Format — Prettier
pnpm format

# Target a specific package
pnpm --filter @granit/utils lint
pnpm --filter @granit/authentication test
```

## How to Contribute

### Reporting Bugs

Open an issue using the **Bug Report** template. Include:

- A clear, concise description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS

### Suggesting Features

Open an issue using the **Feature Request** template. Describe:

- The use case and motivation
- How it fits into Granit's modular architecture
- Any alternatives you considered

### Submitting Changes

1. **Fork** the repository
2. **Create a branch** from `develop`:

   ```text
   <type>/<short-description>

   Types: feature/ | fix/ | docs/ | refactor/ | chore/ | test/ | perf/
   ```

3. **Write your code** following the conventions below
4. **Write or update tests** — every package has co-located tests in `src/__tests__/`
5. **Run the Definition of Done checks** (see below)
6. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat(query-engine): add enum filter support"
   git commit -m "fix(auth): handle expired token refresh"
   git commit -m "docs: update getting started guide"
   ```

7. **Open a pull request** against `develop`

### Definition of Done

All checks are **blocking** — a PR will not be merged until they pass:

1. `pnpm lint` — zero warnings
2. `pnpm tsc` — zero TypeScript errors
3. `pnpm test run` — all tests pass
4. `npx markdownlint-cli2 "<file>"` — every modified `.md` file passes
5. Code coverage &ge; 80% on new code
6. Documentation updated if the change affects public API or behavior

## Code Conventions

### TypeScript

- **Target**: ES2022, **TypeScript strict** mode
- **Nullable**: `verbatimModuleSyntax` enabled
- **`import type`**: mandatory for type-only imports
- **No implicit `any`** — TypeScript strict on all `.ts`/`.tsx` files

### ESLint

- Zero warnings tolerated (`--max-warnings 0`)
- Strict import ordering (`import-x/order`) — run `npx eslint --fix` after
  creating new files
- No blank lines between import groups

### Package Structure

Each `@granit/*` package follows this structure:

```text
packages/@granit/my-package/
├── package.json          ← exports: { ".": "./src/index.ts" }
├── tsconfig.json
└── src/
    ├── index.ts          ← single entry point (re-exports)
    ├── types/            ← exported types and interfaces
    ├── api/              ← API call functions
    ├── hooks/            ← React hooks
    ├── providers/        ← React contexts and providers
    └── __tests__/        ← co-located tests
        ├── hook-a.test.ts
        └── hook-b.test.tsx
```

### Architecture Principles

- **Source-direct**: packages export `.ts` files — no build, no `dist/`
- **Single entry point**: `src/index.ts` re-exports the public API
- **Headless**: packages provide hooks and logic — UI components live in
  consumer applications
- **App-agnostic**: no application-specific code (no FHIR, Capacitor, etc.)

### Dependencies

- External dependencies go in `peerDependencies`, never `dependencies`
- The consumer application installs the required versions
- When adding, removing, or upgrading a dependency, update
  `THIRD-PARTY-NOTICES.md` at the repository root

### Tests

- **Framework**: Vitest + React Testing Library
- **Coverage**: v8 provider, &ge; 80% threshold
- **Files**: co-located in `src/__tests__/`

### Security

**Never**:

- Commit secrets or credentials
- Log PII in plain text
- Disable security scans

**Always**:

- Encrypt sensitive data in transit
- Maintain audit trail for sensitive operations

## Review Process

A maintainer will review your PR against this checklist:

- [ ] No hardcoded secrets
- [ ] Tests pass (`pnpm test run`)
- [ ] Lint passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm tsc`)
- [ ] No PII in logs
- [ ] THIRD-PARTY-NOTICES.md updated (if dependencies changed)
- [ ] Documentation updated if applicable

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](LICENSE).
