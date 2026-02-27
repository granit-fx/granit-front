# Tests

Conventions, stack et patterns de test pour granit-front.

## Philosophie

Granit-front applique une approche mixte :

- **Tests unitaires** pour les fonctions pures (`@granit/utils`, `@granit/logger`)
- **Tests d'intégration React** pour les hooks et contextes (`@granit/auth`)
- **Couverture ≥ 80 %** sur tout nouveau code — exigence bloquante

## Stack de tests

| Outil | Rôle |
| --- | --- |
| [Vitest](https://vitest.dev/) 3 | Runner de tests, compatible ESM natif |
| [@testing-library/react](https://testing-library.com/react) 16 | `render()`, `renderHook()`, `screen`, `waitFor()` |
| jsdom 26 | Environnement DOM pour les tests React |
| v8 (coverage) | Fournisseur de couverture — rapports lcov, HTML, Cobertura |

## Configuration

Le fichier `vitest.config.ts` à la racine configure l'ensemble du workspace :

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'packages/@granit/*/src/**/*.test.ts',
      'packages/@granit/*/src/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['packages/@granit/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    },
  },
});
```

## Commandes

```bash
pnpm test               # Mode watch — développement
pnpm test:coverage      # Exécution unique avec couverture
pnpm --filter @granit/auth test  # Cibler un package
```

## Structure des fichiers de test

Les tests sont co-localisés avec les sources dans `src/__tests__/` :

```
packages/@granit/auth/
└── src/
    ├── index.ts
    ├── keycloak-core.ts
    ├── use-auth-context.ts
    ├── mock-provider.tsx
    └── __tests__/
        ├── keycloak-core.test.tsx
        ├── use-auth-context.test.tsx
        └── mock-provider.test.tsx
```

## Conventions de nommage

| Élément | Convention | Exemple |
| --- | --- | --- |
| Fichier de test | `<module>.test.ts(x)` | `logger.test.ts` |
| Bloc `describe` | Nom de la fonction ou du hook | `describe('createLogger', …)` |
| Bloc `it` | Comportement attendu en anglais | `it('should log warn in production', …)` |

## Patterns de mock

### Espionner la console (`@granit/logger`)

```typescript
const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Act
logger.warn('Token expiré');

// Assert
expect(warnSpy).toHaveBeenCalledWith(
  expect.stringContaining('[MonApp]'),
  'Token expiré',
);
```

### Mocker un module (`@granit/api-client`)

```typescript
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));
```

### Mocks hoistés avec état mutable (`@granit/auth`)

```typescript
const mockKeycloak = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(true),
  authenticated: true,
  token: 'mock-token',
  loadUserInfo: vi.fn().mockResolvedValue({ sub: '123', name: 'Test' }),
  updateToken: vi.fn().mockResolvedValue(true),
}));

vi.mock('keycloak-js', () => ({
  default: vi.fn(() => mockKeycloak),
}));
```

### Tester un hook React avec contexte

```typescript
import { renderHook } from '@testing-library/react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockAuthValue}>
    {children}
  </AuthContext.Provider>
);

const { result } = renderHook(() => useAuth(), { wrapper });
expect(result.current.authenticated).toBe(true);
```

## Bonnes pratiques

1. **Un `describe` par fonction/hook exporté** — pas de tests à plat
2. **Tests autonomes** — chaque `it` est indépendant, pas de dépendance entre tests
3. **`mockImplementation(() => {})`** sur les spies console pour éviter le bruit
4. **`vi.clearAllMocks()`** dans `beforeEach` pour un état propre à chaque test
5. **Assertions exactes** — préférer `toEqual()` à `toMatchObject()` quand possible
6. **`act()` et `waitFor()`** pour tout test async impliquant des hooks React
7. **Pas d'utilitaires de test partagés** — chaque fichier de test est auto-suffisant

## Couverture

Les rapports de couverture sont générés dans `./coverage/` :

| Format | Fichier | Usage |
| --- | --- | --- |
| Texte | terminal | Développeur (résumé rapide) |
| HTML | `coverage/index.html` | Développeur (exploration détaillée) |
| LCOV | `coverage/lcov.info` | SonarQube |
| Cobertura | `coverage/cobertura-coverage.xml` | GitLab CI (widget MR) |

## Voir aussi

- [Framework](../framework/index.md) — documentation de référence des modules
- [CI/CD](../deployment/index.md) — pipeline de qualité et intégration continue
