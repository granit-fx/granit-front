<p align="center">
  <img src="docs/images/granit-logo.svg" alt="Granit Front" height="80" />
</p>

# granit-front

Framework TypeScript/React partagé — équivalent JavaScript/TypeScript de `granit-dotnet`.

Fournit les briques communes à toutes les applications front-end Digital Dynamics : logger,
types OIDC, utilitaires, client HTTP Axios et couche d'authentification Keycloak.

## Packages

| Package | Description |
| --- | --- |
| [`@granit/logger`](docs/framework/logger.md) | Factory de loggers configurables (`createLogger`) |
| [`@granit/types`](docs/framework/types.md) | Types TypeScript partagés (`KeycloakUserInfo`, `PaginatedResponse`) |
| [`@granit/utils`](docs/framework/utils.md) | Utilitaires partagés (`cn`, `formatDate`, `formatNumber`, …) |
| [`@granit/api-client`](docs/framework/api-client.md) | Factory Axios avec intercepteur Bearer token |
| [`@granit/auth`](docs/framework/auth.md) | Hooks Keycloak, factory de contexte auth, mock provider |

## Documentation

| Section | Description |
| --- | --- |
| [Framework](docs/framework/index.md) | Documentation de référence de chaque module |
| [Guide](docs/guide/index.md) | Tutoriels pas-à-pas, démarrage rapide |
| [Tests](docs/testing/index.md) | Conventions, stack Vitest, patterns de mock, couverture |
| [CI/CD et qualité](docs/deployment/index.md) | Pipeline GitLab CI, analyse de qualité, workflow de release |
| [Patterns](docs/patterns/index.md) | 8 design patterns identifiés dans granit-front |

## Intégration dans une application

Les packages sont consommés directement depuis les sources TypeScript — aucun build step séparé.

### 1. `package.json`

```json
{
  "dependencies": {
    "@granit/logger":     "link:../../../granit-front/packages/@granit/logger",
    "@granit/types":      "link:../../../granit-front/packages/@granit/types",
    "@granit/utils":      "link:../../../granit-front/packages/@granit/utils",
    "@granit/api-client": "link:../../../granit-front/packages/@granit/api-client",
    "@granit/auth":       "link:../../../granit-front/packages/@granit/auth"
  }
}
```

### 2. `vite.config.ts`

```typescript
import path from 'path';

const GRANIT = path.resolve(__dirname, '../../../granit-front/packages/@granit');

export default defineConfig({
  resolve: {
    alias: {
      '@granit/logger':     path.join(GRANIT, 'logger/src/index.ts'),
      '@granit/types':      path.join(GRANIT, 'types/src/index.ts'),
      '@granit/utils':      path.join(GRANIT, 'utils/src/index.ts'),
      '@granit/api-client': path.join(GRANIT, 'api-client/src/index.ts'),
      '@granit/auth':       path.join(GRANIT, 'auth/src/index.ts'),
    },
  },
});
```

### 3. `tsconfig.json` (paths)

```json
{
  "compilerOptions": {
    "paths": {
      "@granit/logger":     ["../../../granit-front/packages/@granit/logger/src/index.ts"],
      "@granit/types":      ["../../../granit-front/packages/@granit/types/src/index.ts"],
      "@granit/utils":      ["../../../granit-front/packages/@granit/utils/src/index.ts"],
      "@granit/api-client": ["../../../granit-front/packages/@granit/api-client/src/index.ts"],
      "@granit/auth":       ["../../../granit-front/packages/@granit/auth/src/index.ts"]
    }
  }
}
```

À répéter dans chaque tsconfig de l'application : `tsconfig.app.json`, `tsconfig.test.json`, `tsconfig.storybook.json`.

## Commandes workspace

```bash
# Tous les packages
pnpm lint               # ESLint (0 warnings max)
pnpm tsc                # TypeScript check (tous les packages)
pnpm test               # Vitest — mode watch
pnpm test:coverage      # Vitest — couverture v8 (lcov + html)

# Cibler un package
pnpm --filter @granit/utils lint
pnpm --filter @granit/auth test
```

## Conventions

- **Source-direct** : les packages exportent les fichiers `.ts` — `"exports": { ".": "./src/index.ts" }`, pas de `dist/`
- **Peer deps** : les dépendances tierces (`axios`, `clsx`, `keycloak-js`…) sont déclarées en `peerDependencies` et fournies par l'application consommatrice
- **API stable** : tout changement d'export public requiert une mise à jour coordonnée de `guava-front` et `guava-admin`
- **Pas de code app-spécifique** : aucune logique FHIR, Capacitor, rôle admin, ou contrainte HDS dans les packages

## Applications consommatrices

| Application | Chemin relatif depuis ce dépôt |
| --- | --- |
| `guava-front` | `../../guava-platform/applications/guava-front` |
| `guava-admin` | `../../guava-platform/applications/guava-admin` |
