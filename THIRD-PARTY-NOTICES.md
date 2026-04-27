# Third-Party Notices — granit-front

This file lists the third-party libraries used by the **granit-front** project
along with their respective licenses. It is updated whenever an external
dependency is added or modified.

Last updated: 2026-04-27

---

## License Summary

| License      | Package count |
| ------------ | ------------- |
| MIT          | 36            |
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
| @azure/msal-browser             | 5.x     | Copyright (c) Microsoft Corporation        |
| @capacitor/push-notifications   | 8.0.3   | Copyright (c) Drifty Co.                   |
| @commitlint/cli                 | 20.5.0  | commitlint Contributors                    |
| @commitlint/config-conventional | 20.5.0  | commitlint Contributors                    |
| @eslint/js                      | 10.0.1  | OpenJS Foundation                          |
| @microsoft/fetch-event-source   | 2.0.1   | Copyright (c) Microsoft Corporation        |
| @microsoft/signalr              | 10.0.0  | Copyright (c) .NET Foundation              |
| @tanstack/react-query           | 5.99.0  | Copyright (c) Tanner Linsley               |
| @tanstack/react-virtual         | 3.13.24 | Copyright (c) Tanner Linsley               |
| @testing-library/jest-dom       | 6.9.1   | Copyright (c) Testing Library Contributors |
| @testing-library/react          | 16.3.2  | Copyright (c) Testing Library Contributors |
| @testing-library/user-event     | 14.6.1  | Copyright (c) Testing Library Contributors |
| @types/react                    | 19.2.14 | DefinitelyTyped Contributors               |
| @vitejs/plugin-react            | 6.0.1   | Copyright (c) Evan You                     |
| @vitest/coverage-v8             | 4.1.4   | Vitest Contributors                        |
| axios                           | 1.15.0  | Copyright (c) Matt Zabriskie               |
| clsx                            | 2.1.1   | Copyright (c) Luke Edwards                 |
| date-fns                        | 4.1.0   | Copyright (c) Sasha Koss                   |
| eslint                          | 10.2.1  | OpenJS Foundation                          |
| eslint-plugin-import-x          | 4.16.2  | eslint-plugin-import-x Contributors        |
| husky                           | 9.1.7   | Copyright (c) typicode                     |
| i18next                         | 26.0.6  | Copyright (c) i18next Contributors         |
| jsdom                           | 29.0.2  | Copyright (c) jsdom Contributors           |
| lint-staged                     | 16.4.0  | Copyright (c) Andrey Okonetchnikov         |
| markdownlint-cli2               | 0.22.0  | Copyright (c) David Anson                  |
| msw                             | 2.13.4  | Copyright (c) Artem Zakharchenko           |
| prettier                        | 3.8.3   | Copyright (c) James Long                   |
| react                           | 19.2.5  | Copyright (c) Meta Platforms, Inc.         |
| react-dom                       | 19.2.5  | Copyright (c) Meta Platforms, Inc.         |
| react-hook-form                 | 7.72.1  | Copyright (c) react-hook-form Contributors |
| react-i18next                   | 17.0.4  | Copyright (c) i18next Contributors         |
| tailwind-merge                  | 3.5.0   | Copyright (c) Dany Castillo                |
| tsup                            | 8.5.1   | Copyright (c) EGOIST                       |
| typescript-eslint               | 8.58.2  | typescript-eslint Contributors             |
| amazon-cognito-identity-js      | 6.3.16  | Copyright (c) Amazon.com, Inc.             |
| vitest                          | 4.1.4   | Vitest Contributors                        |

### Apache-2.0

| Package                                         | Version | Copyright                           |
| ----------------------------------------------- | ------- | ----------------------------------- |
| @opentelemetry/api                              | 1.9.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/context-zone                     | 2.7.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/exporter-trace-otlp-http         | 0.215.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation                  | 0.215.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-document-load    | 0.60.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-fetch            | 0.215.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-xml-http-request | 0.215.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/resources                        | 2.7.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/sdk-trace-web                    | 2.7.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/semantic-conventions             | 1.40.0  | Copyright The OpenTelemetry Authors |
| firebase                                        | 12.x    | Copyright Google LLC                |
| keycloak-js                                     | 26.2.3  | Copyright Red Hat, Inc.             |
| typescript                                      | 6.0.3   | Copyright (c) Microsoft Corporation |

### BSD-3-Clause

| Package | Version | Copyright                            |
| ------- | ------- | ------------------------------------ |
| klaro   | 0.7.21  | Copyright (c) KIProtect GmbH, Berlin |

> `klaro` is a peerDependency of `@granit/cookies-klaro`, installed in
> consumer applications.
>
> `@azure/msal-browser` is a peerDependency of `@granit/authentication-entraid`,
> `amazon-cognito-identity-js` is a peerDependency of `@granit/authentication-cognito`,
> and `firebase` is a peerDependency of `@granit/authentication-google-cloud`.
> These are installed in consumer applications that use the corresponding provider.
