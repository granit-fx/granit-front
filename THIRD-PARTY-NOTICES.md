# Third-Party Notices — granit-front

This file lists the third-party libraries used by the **granit-front** project
along with their respective licenses. It is updated whenever an external
dependency is added or modified.

Last updated: 2026-03-24

---

## License Summary

| License      | Package count |
| ------------ | ------------- |
| MIT          | 34            |
| Apache-2.0   | 13            |
| BSD-3-Clause | 1             |

---

## Dependencies (devDependencies — monorepo workspace)

> The root `package.json` declares no production `dependencies`.
> All dependencies are in `devDependencies` and serve the `@granit/*` workspace
> packages via `peerDependencies`.

### MIT

| Package                         | Version | Copyright                                  |
| ------------------------------- | ------- | ------------------------------------------ |
| @capacitor/push-notifications   | 8.0.2   | Copyright (c) Drifty Co.                   |
| @commitlint/cli                 | 20.5.0  | commitlint Contributors                    |
| @commitlint/config-conventional | 20.5.0  | commitlint Contributors                    |
| @eslint/js                      | 10.0.1  | OpenJS Foundation                          |
| @microsoft/fetch-event-source   | 2.0.1   | Copyright (c) Microsoft Corporation        |
| @microsoft/signalr              | 10.0.0  | Copyright (c) .NET Foundation              |
| @tailwindcss/vite               | 4.2.1   | Copyright (c) Tailwind Labs, Inc.          |
| @tanstack/react-query           | 5.95.2  | Copyright (c) Tanner Linsley               |
| @tanstack/react-virtual         | 3.13.23 | Copyright (c) Tanner Linsley               |
| @testing-library/jest-dom       | 6.9.1   | Copyright (c) Testing Library Contributors |
| @testing-library/react          | 16.3.2  | Copyright (c) Testing Library Contributors |
| @testing-library/user-event     | 14.6.1  | Copyright (c) Testing Library Contributors |
| @types/react                    | 19.2.14 | DefinitelyTyped Contributors               |
| @vitejs/plugin-react            | 6.0.1   | Copyright (c) Evan You                     |
| @vitest/coverage-v8             | 4.1.1   | Vitest Contributors                        |
| axios                           | 1.13.6  | Copyright (c) Matt Zabriskie               |
| clsx                            | 2.1.1   | Copyright (c) Luke Edwards                 |
| date-fns                        | 4.1.0   | Copyright (c) Sasha Koss                   |
| eslint                          | 10.0.3  | OpenJS Foundation                          |
| eslint-plugin-import-x          | 4.16.2  | eslint-plugin-import-x Contributors        |
| husky                           | 9.1.7   | Copyright (c) typicode                     |
| i18next                         | 25.10.9 | Copyright (c) i18next Contributors         |
| jsdom                           | 29.0.0  | Copyright (c) jsdom Contributors           |
| lint-staged                     | 16.4.0  | Copyright (c) Andrey Okonetchnikov         |
| markdownlint-cli2               | 0.21.0  | Copyright (c) David Anson                  |
| msw                             | 2.12.12 | Copyright (c) Artem Zakharchenko           |
| prettier                        | 3.8.1   | Copyright (c) James Long                   |
| react                           | 19.2.4  | Copyright (c) Meta Platforms, Inc.         |
| react-dom                       | 19.2.4  | Copyright (c) Meta Platforms, Inc.         |
| react-hook-form                 | 7.72.0  | Copyright (c) react-hook-form Contributors |
| react-i18next                   | 16.6.6  | Copyright (c) i18next Contributors         |
| tailwind-merge                  | 3.5.0   | Copyright (c) Dany Castillo                |
| tsup                            | 8.5.1   | Copyright (c) EGOIST                       |
| typescript-eslint               | 8.57.2  | typescript-eslint Contributors             |
| vitest                          | 4.1.1   | Vitest Contributors                        |

### Apache-2.0

| Package                                         | Version | Copyright                           |
| ----------------------------------------------- | ------- | ----------------------------------- |
| @opentelemetry/api                              | 1.9.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/context-zone                     | 2.6.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/exporter-trace-otlp-http         | 0.213.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation                  | 0.213.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-document-load    | 0.58.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-fetch            | 0.213.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-xml-http-request | 0.213.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/resources                        | 2.6.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/sdk-trace-web                    | 2.6.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/semantic-conventions             | 1.40.0  | Copyright The OpenTelemetry Authors |
| keycloak-js                                     | 26.2.3  | Copyright Red Hat, Inc.             |
| tailwindcss                                     | 4.2.1   | Copyright (c) Tailwind Labs, Inc.   |
| typescript                                      | 6.0.2   | Copyright (c) Microsoft Corporation |

### BSD-3-Clause

| Package | Version | Copyright                            |
| ------- | ------- | ------------------------------------ |
| klaro   | 0.7.x   | Copyright (c) KIProtect GmbH, Berlin |

> `klaro` is a peerDependency of `@granit/cookies-klaro`, installed in
> consumer applications.
