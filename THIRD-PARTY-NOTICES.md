# Third-Party Notices — granit-front

This file lists the third-party libraries used by the **granit-front** project
along with their respective licenses. It is updated whenever an external
dependency is added or modified.

Last updated: 2026-06-30

---

## License Summary

| License    | Package count |
| ---------- | ------------- |
| MIT        | 53            |
| Apache-2.0 | 15            |

---

## Dependencies (devDependencies — monorepo workspace)

> The root `package.json` declares no production `dependencies`.
> All dependencies are in `devDependencies` and serve the `@granit/*` workspace
> packages via `peerDependencies`.

### MIT

| Package                         | Version | Copyright                                  |
| ------------------------------- | ------- | ------------------------------------------ |
| @azure/msal-browser             | 5.x     | Copyright (c) Microsoft Corporation        |
| @capacitor/push-notifications   | 8.1.1   | Copyright (c) Drifty Co.                   |
| @commitlint/cli                 | 21.1.0  | commitlint Contributors                    |
| @commitlint/config-conventional | 21.1.0  | commitlint Contributors                    |
| @date-fns/tz                    | 1.5.0   | Copyright (c) Sasha Koss                   |
| @dnd-kit/core                   | 6.3.1   | Copyright (c) Claudéric Demers             |
| @dnd-kit/sortable               | 10.0.0  | Copyright (c) Claudéric Demers             |
| @dnd-kit/utilities              | 3.2.2   | Copyright (c) Claudéric Demers             |
| @eslint/js                      | 10.0.1  | OpenJS Foundation                          |
| @puckeditor/core                | 0.21.3  | Copyright (c) Measured Corp                |
| @microsoft/fetch-event-source   | 2.0.1   | Copyright (c) Microsoft Corporation        |
| @microsoft/signalr              | 10.0.0  | Copyright (c) .NET Foundation              |
| @tanstack/react-query           | 5.101.1 | Copyright (c) Tanner Linsley               |
| @tanstack/react-virtual         | 3.14.3  | Copyright (c) Tanner Linsley               |
| @testing-library/jest-dom       | 6.9.1   | Copyright (c) Testing Library Contributors |
| @testing-library/react          | 16.3.2  | Copyright (c) Testing Library Contributors |
| @testing-library/user-event     | 14.6.1  | Copyright (c) Testing Library Contributors |
| @types/node                     | 26.0.0  | DefinitelyTyped Contributors               |
| @types/react                    | 19.2.17 | DefinitelyTyped Contributors               |
| @vitejs/plugin-react            | 6.0.3   | Copyright (c) Evan You                     |
| @vitest/coverage-v8             | 4.1.9   | Vitest Contributors                        |
| axios                           | 1.18.1  | Copyright (c) Matt Zabriskie               |
| clsx                            | 2.1.1   | Copyright (c) Luke Edwards                 |
| date-fns                        | 4.4.0   | Copyright (c) Sasha Koss                   |
| echarts-for-react               | 3.0.6   | Copyright (c) hustcc                       |
| eslint                          | 10.5.0  | OpenJS Foundation                          |
| eslint-plugin-import-x          | 4.17.0  | eslint-plugin-import-x Contributors        |
| husky                           | 9.1.7   | Copyright (c) typicode                     |
| i18next                         | 26.3.2  | Copyright (c) i18next Contributors         |
| isomorphic-dompurify            | 2.x     | Copyright (c) Andrew Karpów                |
| jsdom                           | 29.1.1  | Copyright (c) jsdom Contributors           |
| lint-staged                     | 17.0.7  | Copyright (c) Andrey Okonetchnikov         |
| lucide-react                    | 1.21.0  | Copyright (c) Lucide Contributors          |
| markdownlint-cli2               | 0.22.1  | Copyright (c) David Anson                  |
| marked                          | 18.0.5  | Copyright (c) 2018+ MarkedJS contributors  |
| msw                             | 2.14.6  | Copyright (c) Artem Zakharchenko           |
| prettier                        | 3.8.4   | Copyright (c) James Long                   |
| react                           | 19.2.7  | Copyright (c) Meta Platforms, Inc.         |
| react-dom                       | 19.2.7  | Copyright (c) Meta Platforms, Inc.         |
| react-draggable                 | 4.7.0   | Copyright (c) React Grid Layout Authors    |
| react-grid-layout               | 2.2.3   | Copyright (c) React Grid Layout Authors    |
| react-hook-form                 | 7.80.0  | Copyright (c) react-hook-form Contributors |
| react-i18next                   | 17.0.8  | Copyright (c) i18next Contributors         |
| react-markdown                  | 10.1.0  | Copyright (c) Espen Hovlandsdal            |
| react-resizable                 | 3.1.3   | Copyright (c) React Grid Layout Authors    |
| remark-gfm                      | 4.0.1   | Copyright (c) Titus Wormer                 |
| tailwind-merge                  | 3.6.0   | Copyright (c) Dany Castillo                |
| tsup                            | 8.5.1   | Copyright (c) EGOIST                       |
| typescript-eslint               | 8.62.0  | typescript-eslint Contributors             |
| vanilla-cookieconsent           | 3.1.0   | Copyright (c) Orest Bida                   |
| vite                            | 8.1.0   | Copyright (c) Evan You                     |
| amazon-cognito-identity-js      | 6.3.16  | Copyright (c) Amazon.com, Inc.             |
| vitest                          | 4.1.9   | Vitest Contributors                        |

### Apache-2.0

| Package                                         | Version | Copyright                           |
| ----------------------------------------------- | ------- | ----------------------------------- |
| @opentelemetry/api                              | 1.9.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/context-zone                     | 2.8.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/exporter-trace-otlp-http         | 0.219.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation                  | 0.219.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-document-load    | 0.64.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-fetch            | 0.219.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-xml-http-request | 0.219.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/resources                        | 2.8.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/sdk-trace-web                    | 2.8.0   | Copyright The OpenTelemetry Authors |
| @opentelemetry/semantic-conventions             | 1.41.1  | Copyright The OpenTelemetry Authors |
| dompurify                                       | 3.x     | Copyright (c) Cure53                |
| echarts                                         | 6.1.0   | Copyright Apache ECharts Authors    |
| firebase                                        | 12.x    | Copyright Google LLC                |
| keycloak-js                                     | 26.2.4  | Copyright Red Hat, Inc.             |
| typescript                                      | 6.0.3   | Copyright (c) Microsoft Corporation |

> `vanilla-cookieconsent` is a peerDependency of `@granit/cookies-cookieconsent`.
>
> `@azure/msal-browser` is a peerDependency of `@granit/authentication-entraid`,
> `amazon-cognito-identity-js` is a peerDependency of `@granit/authentication-cognito`,
> and `firebase` is a peerDependency of `@granit/authentication-google-cloud`.
> These are installed in consumer applications that use the corresponding provider.
