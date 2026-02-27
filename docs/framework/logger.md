# @granit/logger

Factory de loggers configurables avec système de transports pluggables.

## API

### `createLogger(prefix, options?): Logger`

Crée une instance de logger préfixée. Chaque application utilise un préfixe distinct.

```typescript
import { createLogger } from '@granit/logger';

const logger = createLogger('🛡️ [MonApp]');

logger.debug('Initialisation', { config });
logger.info('Serveur démarré');
logger.warn('Token expiré bientôt');
logger.error('Échec de la requête', error, { url });
```

### Interface `Logger`

```typescript
interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  child(subPrefix: string): Logger;
}
```

### `LoggerOptions`

```typescript
interface LoggerOptions {
  /** Niveau minimum de log. Défaut : auto (DEBUG en dev, WARN en prod). */
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  /** Transports personnalisés. Défaut : [createConsoleTransport()]. */
  transports?: LogTransport[];
}
```

```typescript
// Forcer le niveau WARN même en dev
const logger = createLogger('[App]', { level: 'WARN' });
```

### Child loggers

Crée un sous-logger avec un préfixe combiné. Le child hérite du niveau et des transports
du parent.

```typescript
const auth = createLogger('[Auth]');
const token = auth.child('[Token]');

token.warn('expired'); // sortie : [Auth] [Token] expired
```

## Transports

### Interface `LogTransport`

```typescript
interface LogEntry {
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  prefix: string;
  message: string;
  error?: unknown;
  context?: Record<string, unknown>;
}

interface LogTransport {
  send(entry: LogEntry): void;
  flush?(): Promise<void>;
}
```

### Console transport (défaut)

Inclus par défaut. Tous les niveaux utilisent un badge CSS coloré uniforme avec le
préfixe dans la sortie.

```typescript
import { createConsoleTransport } from '@granit/logger';
```

| Niveau | Couleur badge | Méthode console |
| --- | --- | --- |
| DEBUG | gris (`#71717a`) | `console.log` |
| INFO | bleu (`#0ea5e9`) | `console.info` |
| WARN | ambre (`#f59e0b`) | `console.warn` |
| ERROR | rouge (`#ef4444`) | `console.error` |

### Transport OTLP HTTP (`@granit/logger-otlp`)

Envoie les logs au format OTLP JSON vers un collecteur OpenTelemetry (Alloy, Aspire
Dashboard).

```typescript
import { createLogger, createConsoleTransport } from '@granit/logger';
import { createOtlpTransport } from '@granit/logger-otlp';

const logger = createLogger('[Guava]', {
  transports: [
    createConsoleTransport(),
    createOtlpTransport({
      endpoint: '/v1/logs',
      serviceName: 'guava-front',
      serviceVersion: '1.0.0',
      environment: 'development',
    }),
  ],
});
```

#### Options `OtlpTransportOptions`

| Option | Type | Défaut | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | — | URL de l'endpoint OTLP HTTP (ex : `/v1/logs`) |
| `serviceName` | `string` | — | Nom du service (resource attribute) |
| `serviceVersion` | `string?` | — | Version du service |
| `environment` | `string?` | — | Environnement de déploiement |
| `headers` | `Record<string, string>?` | — | Headers HTTP supplémentaires |
| `batchSize` | `number?` | `10` | Nombre d'entrées avant flush automatique |
| `flushInterval` | `number?` | `5000` | Intervalle de flush en ms |
| `getTraceContext` | `() => { traceId, spanId }?` | — | Callback pour corrélation log-to-trace |

#### Corrélation avec les traces

Si l'application utilise `@opentelemetry/api` pour le tracing, le `traceId` et `spanId`
peuvent être injectés pour corréler les logs aux traces dans Grafana :

```typescript
import { trace } from '@opentelemetry/api';

createOtlpTransport({
  endpoint: '/v1/logs',
  serviceName: 'guava-front',
  getTraceContext: () => {
    const span = trace.getActiveSpan();
    if (!span) return undefined;
    const { traceId, spanId } = span.spanContext();
    return { traceId, spanId };
  },
});
```

## Configuration par environnement

### Développement (Aspire Dashboard)

Les logs sont envoyés à l'Aspire Dashboard via un proxy Vite :

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/v1/logs': {
        target: 'http://localhost:18889',
        changeOrigin: true,
      },
    },
  },
});
```

### Production (Alloy)

Les logs sont envoyés à Alloy via OTLP HTTP (port 4318). Nécessite une configuration
infra (CORS + Ingress) pour exposer l'endpoint aux navigateurs.

## Comportement par environnement

| Environnement | Niveau minimum affiché |
| --- | --- |
| Développement (`DEV`) | `DEBUG` (tout) |
| Production | `WARN` et `ERROR` uniquement |

Le niveau est configurable via `LoggerOptions.level` pour surcharger le défaut.

## Préfixes recommandés par application

| Application | Préfixe |
| --- | --- |
| `guava-front` | `'🛡️ [Guava]'` |
| `guava-admin` | `'🛡️ [GuavaAdmin]'` |

## Types exportés

| Export | Type | Description |
| --- | --- | --- |
| `LogLevel` | `const` | `{ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }` |
| `LogLevelName` | `type` | `'DEBUG' \| 'INFO' \| 'WARN' \| 'ERROR'` |
| `LogLevelValue` | `type` | `0 \| 1 \| 2 \| 3` |
| `LogContext` | `type` | `Record<string, unknown>` |
| `LogEntry` | `interface` | Entrée structurée envoyée aux transports |
| `LogTransport` | `interface` | Interface pour les transports personnalisés |
| `LoggerOptions` | `interface` | Options de `createLogger` |
| `Logger` | `interface` | Instance de logger |

## Peer dependencies

### `@granit/logger`

Aucune.

### `@granit/logger-otlp`

| Dépendance | Version |
| --- | --- |
| `@granit/logger` | `workspace:*` |
