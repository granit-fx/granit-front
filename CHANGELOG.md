# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Ajouté

- **@granit/query-engine** : enrichissement de `useSmartFilter` avec support enum, boolean,
  field search et labels localisables (2026-03-07)
- **@granit/query-engine** : ajout de `labelParts` aux tokens et exposition de
  `selectedFieldType` (2026-03-07)
- **@granit/cookies** : synchronisation bidirectionnelle CMP (2026-03-06)
- **@granit/notifications** : prop `enabled` pour désactiver SignalR
  conditionnellement (2026-03-05)
- **@granit/error-boundary** : nouveau package — capture structurée des erreurs
  (`GranitErrorBoundary`, `GlobalErrorCapture`, `ErrorContextProvider`,
  `useBreadcrumb`) (2026-03-04)
- **@granit/tracing** : nouveau package — tracing distribué OpenTelemetry
  (`TracingProvider`, `useTracer`, `useSpan`, `getTraceContext`) (2026-03-04)
- **@granit/auth** : hook `usePermissions` pour l'autorisation frontend
  (`usePermissions`, `usePermissionDefinitions`, `useRolePermissions`,
  `usePermissionGrant`) (2026-03-04)
- **@granit/data-exchange** : nouveau package — export et import tabulaire
  (renommé depuis `@granit/data-export`) (2026-03-04)
- **@granit/query-engine** : nouveau package — vues liste filtrées headless
  (`useQueryMeta`, `useQueryEndpoint`, `useSavedViews`, `useSmartFilter`) (2026-03-04)
- **@granit/ui** et **@granit/ui-back** : packages de composants UI partagés
  (2026-03-03)
- **Infrastructure** : publication npm des packages `@granit/*` (2026-03-03)
- **@granit/api-client** et **@granit/auth** : intercepteur 401 et gestion des
  sessions révoquées (2026-03-02)
- **@granit/notifications** : nouveau package — notifications temps réel via
  SignalR (`useNotifications`, `useUnreadCount`, `useRealTimeNotifications`,
  `useEntityActivityFeed`, `useNotificationPreferences`) (2026-03-02)
- **@granit/cookies** et **@granit/cookies-klaro** : nouveaux packages — gestion
  du consentement cookies avec adaptateur Klaro (2026-03-01)
- **@granit/workflow** : nouveau package — cycle de vie workflow headless
  (`useWorkflowStatus`, `useWorkflowTransition`, `useWorkflowHistory`)
  (2026-03-01)
- **@granit/timeline** : nouveau package — fil d'activité unifié headless
  (`useTimeline`, `useTimelineActions`, `useTimelineFollowers`) (2026-03-01)
- **Documentation** : `THIRD-PARTY-NOTICES.md` — licences tierces (2026-03-01)
- **@granit/localization** : nouveau package — gestion de la localisation
  (2026-02-28)
- **@granit/storage** : nouveau package — abstraction du stockage (2026-02-28)
- **@granit/api-client** : support multi-tenant, mutator Orval et type
  `ProblemDetails` (2026-02-27)
- **@granit/auth** : enrichissement de l'intégration Keycloak — événements,
  rôles, options login/logout (2026-02-27)
- **@granit/logger** : refactoring avec système de transports pluggables
  (2026-02-27)
- **Infrastructure** : pipeline GitLab CI avec SonarQube, jobs sécurité,
  ESLint strict (2026-02-27)
- **Documentation** : documentation framework, guide de démarrage rapide,
  patterns (2026-02-27)
- **@granit/logger**, **@granit/utils**, **@granit/api-client**, **@granit/auth** :
  packages fondateurs — initialisation du dépôt granit-front (2026-02-27)

### Modifié

- **@granit/query-engine** : adaptation de la pagination `skip`/`take` vers
  `page`/`pageSize` (`PagedResult<T>`) (2026-03-08)
- **@granit/query-engine** : extraction des ternaires imbriqués et réduction de la
  complexité cognitive (2026-03-07)
- **Architecture** : transformation des packages en headless — suppression de
  `@granit/ui` (2026-03-06)
- **@granit/data-exchange** : alignement des noms de types TypeScript avec le
  renommage backend (2026-03-06)
- **@granit/ui-back** : élimination de la duplication avec `@granit/ui`
  (2026-03-04)
- **@granit/types** : suppression du package — distribution des types dans les
  modules consommateurs (2026-03-03)
- **Infrastructure** : ajout de Prettier, Husky, commitlint et reformatage
  des packages (2026-03-06)
- **Infrastructure** : alignement des versions des dépendances externes
  (2026-03-04)
- **CI/CD** : extraction de la configuration SonarQube dans
  `sonar-project.properties` (2026-02-28)

### Corrigé

- **Tous les packages** : migration de tous les endpoints vers `/api/v1`
  (2026-03-06)
- **@granit/cookies-klaro** : persistance du consentement et chargement dynamique
  (2026-03-06)
- **@granit/cookies** : rafraîchissement de `hasConsented` après chaque action CMP
  (2026-03-06)
- **Observabilité** : dégradation gracieuse quand le collecteur OTLP est absent
  (2026-03-06)
- **@granit/localization** : guard contre `data.resources` undefined dans
  `applyTranslations` (2026-03-04)
- **SonarQube** : correction des code smells sur `error-boundary`, `tracing`,
  `workflow`, `data-exchange`, `query-engine`, `ui`, `ui-back` (2026-03-04)
- **Sécurité** : correction de la vulnérabilité `immutable` (2026-03-05)
- **@granit/notifications** : extraction de `createConnection` hors du callback
  `vi.hoisted` (2026-03-03)
- **SonarQube** : mutualisation des utilitaires de test Axios dupliqués
  (2026-03-02)
- **SonarQube** : correction des issues `localization` et `storage` (2026-02-28)
- **CI/CD** : ajout de timeout de 2h au job SonarQube (2026-02-28)
- **CI/CD** : correction des erreurs TypeScript et ESLint détectées par la CI
  (2026-02-27)

### Supprimé

- **@granit/ui** : supprimé lors du passage à l'architecture headless — les
  composants UI vivent désormais dans les applications consommatrices (2026-03-06)
- **@granit/types** : supprimé — types distribués dans les modules
  consommateurs (2026-03-03)
