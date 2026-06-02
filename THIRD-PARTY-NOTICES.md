# Third-Party Notices — granit-front

This file lists the third-party libraries used by the **granit-front** project
along with their respective licenses. It is updated whenever an external
dependency is added or modified.

Last updated: 2026-06-02

---

## License Summary

| License      | Package count |
| ------------ | ------------- |
| MIT          | 43            |
| Apache-2.0   | 14            |
| BSD-3-Clause | 1             |

---

## Dependencies (devDependencies — monorepo workspace)

> The root `package.json` declares no production `dependencies`.
> All dependencies are in `devDependencies` and serve the `@granit/*` workspace
> packages via `peerDependencies`.

### MIT

| Package                         | Version  | Copyright                                  |
| ------------------------------- | -------- | ------------------------------------------ |
| @azure/msal-browser             | 5.x      | Copyright (c) Microsoft Corporation        |
| @capacitor/push-notifications   | 8.0.3    | Copyright (c) Drifty Co.                   |
| @commitlint/cli                 | 21.0.2   | commitlint Contributors                    |
| @commitlint/config-conventional | 21.0.2   | commitlint Contributors                    |
| @date-fns/tz                    | 1.5.0    | Copyright (c) Sasha Koss                   |
| @eslint/js                      | 10.0.1   | OpenJS Foundation                          |
| @puckeditor/core                | 0.21.2   | Copyright (c) Measured Corp                |
| @microsoft/fetch-event-source   | 2.0.1    | Copyright (c) Microsoft Corporation        |
| @microsoft/signalr              | 10.0.0   | Copyright (c) .NET Foundation              |
| @tanstack/react-query           | 5.100.11 | Copyright (c) Tanner Linsley               |
| @tanstack/react-virtual         | 3.13.26  | Copyright (c) Tanner Linsley               |
| @testing-library/jest-dom       | 6.9.1    | Copyright (c) Testing Library Contributors |
| @testing-library/react          | 16.3.2   | Copyright (c) Testing Library Contributors |
| @testing-library/user-event     | 14.6.1   | Copyright (c) Testing Library Contributors |
| @types/node                     | 25.9.1   | DefinitelyTyped Contributors               |
| @types/react                    | 19.2.15  | DefinitelyTyped Contributors               |
| @vitejs/plugin-react            | 6.0.2    | Copyright (c) Evan You                     |
| @vitest/coverage-v8             | 4.1.8    | Vitest Contributors                        |
| axios                           | 1.16.1   | Copyright (c) Matt Zabriskie               |
| clsx                            | 2.1.1    | Copyright (c) Luke Edwards                 |
| date-fns                        | 4.4.0    | Copyright (c) Sasha Koss                   |
| echarts-for-react               | 3.0.6    | Copyright (c) hustcc                       |
| eslint                          | 10.4.1   | OpenJS Foundation                          |
| eslint-plugin-import-x          | 4.16.2   | eslint-plugin-import-x Contributors        |
| husky                           | 9.1.7    | Copyright (c) typicode                     |
| i18next                         | 26.3.0   | Copyright (c) i18next Contributors         |
| jsdom                           | 29.1.1   | Copyright (c) jsdom Contributors           |
| lint-staged                     | 17.0.7   | Copyright (c) Andrey Okonetchnikov         |
| lucide-react                    | 1.17.0   | Copyright (c) Lucide Contributors          |
| markdownlint-cli2               | 0.22.1   | Copyright (c) David Anson                  |
| msw                             | 2.14.6   | Copyright (c) Artem Zakharchenko           |
| prettier                        | 3.8.3    | Copyright (c) James Long                   |
| react                           | 19.2.6   | Copyright (c) Meta Platforms, Inc.         |
| react-dom                       | 19.2.6   | Copyright (c) Meta Platforms, Inc.         |
| react-hook-form                 | 7.77.0   | Copyright (c) react-hook-form Contributors |
| react-i18next                   | 17.0.8   | Copyright (c) i18next Contributors         |
| tailwind-merge                  | 3.6.0    | Copyright (c) Dany Castillo                |
| tsup                            | 8.5.1    | Copyright (c) EGOIST                       |
| typescript-eslint               | 8.60.0   | typescript-eslint Contributors             |
| vanilla-cookieconsent           | 3.1.0    | Copyright (c) Orest Bida                   |
| vite                            | 8.0.16   | Copyright (c) Evan You                     |
| amazon-cognito-identity-js      | 6.3.16   | Copyright (c) Amazon.com, Inc.             |
| vitest                          | 4.1.8    | Vitest Contributors                        |

### Apache-2.0

| Package                                         | Version | Copyright                           |
| ----------------------------------------------- | ------- | ----------------------------------- |
| @opentelemetry/api                              | 1.9.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/context-zone                     | 2.7.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/exporter-trace-otlp-http         | 0.218.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation                  | 0.218.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-document-load    | 0.63.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-fetch            | 0.218.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-xml-http-request | 0.218.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/resources                        | 2.7.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/sdk-trace-web                    | 2.7.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/semantic-conventions             | 1.41.1  | Copyright The OpenTelemetry Authors |
| echarts                                         | 6.1.0   | Copyright Apache ECharts Authors    |
| firebase                                        | 12.x    | Copyright Google LLC                |
| keycloak-js                                     | 26.2.4  | Copyright Red Hat, Inc.             |
| typescript                                      | 6.0.3   | Copyright (c) Microsoft Corporation |

### BSD-3-Clause

| Package | Version | Copyright                            |
| ------- | ------- | ------------------------------------ |
| klaro   | 0.7.21  | Copyright (c) KIProtect GmbH, Berlin |

> `klaro` is a peerDependency of the deprecated `@granit/cookies-klaro`, installed in
> consumer applications. `vanilla-cookieconsent` is a peerDependency of
> `@granit/cookies-cookieconsent`, its replacement.
>
> `@azure/msal-browser` is a peerDependency of `@granit/authentication-entraid`,
> `amazon-cognito-identity-js` is a peerDependency of `@granit/authentication-cognito`,
> and `firebase` is a peerDependency of `@granit/authentication-google-cloud`.
> These are installed in consumer applications that use the corresponding provider.
