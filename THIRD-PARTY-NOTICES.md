# Third-Party Notices — granit-front

This file lists the third-party libraries used by the **granit-front** project
along with their respective licenses. It is updated whenever an external
dependency is added or modified.

Last updated: 2026-08-16

---

## License Summary

| License               | Package count |
| --------------------- | ------------- |
| MIT                   | 76            |
| Apache-2.0            | 16            |
| ISC                   | 1             |
| MPL-2.0 OR Apache-2.0 | 1             |
| **Total**             | **94**        |

---

## Dependencies (devDependencies — monorepo workspace)

> The root `package.json` declares no production `dependencies`.
> All dependencies are in `devDependencies` and serve the `@granit/*` workspace
> packages via `peerDependencies`.

### MIT

| Package                         | Version | Copyright                                                           |
| ------------------------------- | ------- | ------------------------------------------------------------------- |
| axios                           | 1.19.0  | Copyright (c) Matt Zabriskie                                        |
| @azure/msal-browser             | 5.17.3  | Copyright (c) Microsoft Corporation                                 |
| @capacitor/push-notifications   | 8.1.2   | Copyright (c) Drifty Co.                                            |
| clsx                            | 2.1.1   | Copyright (c) Luke Edwards                                          |
| cmdk                            | 1.1.1   | Copyright (c) 2022 Paco Coursey                                     |
| @commitlint/cli                 | 21.2.2  | commitlint Contributors                                             |
| @commitlint/config-conventional | 21.2.2  | commitlint Contributors                                             |
| date-fns                        | 4.4.0   | Copyright (c) Sasha Koss                                            |
| @date-fns/tz                    | 1.5.0   | Copyright (c) Sasha Koss                                            |
| @dnd-kit/core                   | 6.3.1   | Copyright (c) Claudéric Demers                                      |
| @dnd-kit/sortable               | 10.0.0  | Copyright (c) Claudéric Demers                                      |
| @dnd-kit/utilities              | 3.2.2   | Copyright (c) Claudéric Demers                                      |
| echarts-for-react               | 3.0.6   | Copyright (c) hustcc                                                |
| eslint                          | 10.8.1  | OpenJS Foundation                                                   |
| eslint-plugin-import-x          | 4.17.1  | eslint-plugin-import-x Contributors                                 |
| @eslint/js                      | 10.0.1  | OpenJS Foundation                                                   |
| husky                           | 9.1.7   | Copyright (c) typicode                                              |
| i18next                         | 26.3.6  | Copyright (c) i18next Contributors                                  |
| isomorphic-dompurify            | 3.21.0  | Copyright (c) Andrew Karpów                                         |
| jsdom                           | 30.0.1  | Copyright (c) jsdom Contributors                                    |
| libphonenumber-js               | 1.13.11 | Copyright (c) 2016 @catamphetamine                                  |
| lint-staged                     | 17.3.0  | Copyright (c) Andrey Okonetchnikov                                  |
| markdownlint-cli2               | 0.23.2  | Copyright (c) David Anson                                           |
| marked                          | 18.0.7  | Copyright (c) 2018+ MarkedJS contributors                           |
| @microsoft/fetch-event-source   | 2.0.1   | Copyright (c) Microsoft Corporation                                 |
| @microsoft/signalr              | 10.0.0  | Copyright (c) .NET Foundation                                       |
| msw                             | 2.15.0  | Copyright (c) Artem Zakharchenko                                    |
| msw-storybook-addon             | 3.0.0   | Copyright (c) 2026–present Artem Zakharchenko                       |
| next-themes                     | 0.4.6   | Copyright (c) 2022 Paco Coursey                                     |
| prettier                        | 3.9.6   | Copyright (c) James Long                                            |
| @puckeditor/core                | 0.22.4  | Copyright (c) Measured Corp                                         |
| react                           | 19.2.8  | Copyright (c) Meta Platforms, Inc.                                  |
| react-dom                       | 19.2.8  | Copyright (c) Meta Platforms, Inc.                                  |
| react-draggable                 | 4.7.1   | Copyright (c) React Grid Layout Authors                             |
| react-grid-layout               | 2.2.4   | Copyright (c) React Grid Layout Authors                             |
| react-hook-form                 | 7.85.0  | Copyright (c) react-hook-form Contributors                          |
| react-i18next                   | 17.0.11 | Copyright (c) i18next Contributors                                  |
| react-markdown                  | 10.1.0  | Copyright (c) Espen Hovlandsdal                                     |
| react-resizable                 | 3.2.0   | Copyright (c) React Grid Layout Authors                             |
| react-router                    | 8.3.0   | Copyright (c) React Training LLC, Remix Software Inc., Shopify Inc. |
| remark-gfm                      | 4.0.1   | Copyright (c) Titus Wormer                                          |
| sonner                          | 2.0.8   | Copyright (c) 2023 Emil Kowalski                                    |
| storybook                       | 10.5.8  | Storybook Contributors                                              |
| @storybook/addon-a11y           | 10.5.8  | Storybook Contributors                                              |
| @storybook/addon-docs           | 10.5.8  | Storybook Contributors                                              |
| @storybook/addon-themes         | 10.5.8  | Storybook Contributors                                              |
| @storybook/react-vite           | 10.5.8  | Storybook Contributors                                              |
| tailwind-merge                  | 3.6.0   | Copyright (c) Dany Castillo                                         |
| tailwindcss                     | 4.3.3   | Copyright (c) Tailwind Labs, Inc.                                   |
| @tailwindcss/vite               | 4.3.3   | Copyright (c) Tailwind Labs, Inc.                                   |
| @tanstack/react-query           | 5.101.4 | Copyright (c) Tanner Linsley                                        |
| @tanstack/react-table           | 9.1.2   | Copyright (c) Tanner Linsley                                        |
| @tanstack/react-virtual         | 3.14.9  | Copyright (c) Tanner Linsley                                        |
| @testing-library/jest-dom       | 7.0.1   | Copyright (c) Testing Library Contributors                          |
| @testing-library/react          | 16.3.2  | Copyright (c) Testing Library Contributors                          |
| @testing-library/user-event     | 14.6.4  | Copyright (c) Testing Library Contributors                          |
| @tiptap/core                    | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/extension-mention       | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/extension-placeholder   | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/extension-task-item     | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/extension-task-list     | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/extension-text-align    | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/react                   | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/starter-kit             | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| @tiptap/suggestion              | 3.30.1  | Copyright (c) 2025, Tiptap GmbH                                     |
| tsup                            | 8.5.1   | Copyright (c) EGOIST                                                |
| tw-animate-css                  | 1.4.0   | Copyright (c) 2025 Wombosvideo                                      |
| @types/node                     | 26.2.0  | DefinitelyTyped Contributors                                        |
| @types/react                    | 19.2.18 | DefinitelyTyped Contributors                                        |
| typescript-eslint               | 8.67.0  | typescript-eslint Contributors                                      |
| vanilla-cookieconsent           | 3.1.0   | Copyright (c) Orest Bida                                            |
| vite                            | 8.2.0   | Copyright (c) Evan You                                              |
| @vitejs/plugin-react            | 6.0.5   | Copyright (c) Evan You                                              |
| vitest                          | 4.1.10  | Vitest Contributors                                                 |
| @vitest/coverage-v8             | 4.1.10  | Vitest Contributors                                                 |
| zustand                         | 5.0.15  | Copyright (c) 2019 Paul Henschel                                    |

### Apache-2.0

| Package                                         | Version | Copyright                           |
| ----------------------------------------------- | ------- | ----------------------------------- |
| @opentelemetry/api                              | 1.9.1   | Copyright The OpenTelemetry Authors |
| @opentelemetry/context-zone                     | 2.10.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/core                             | 2.10.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/exporter-trace-otlp-http         | 0.221.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation                  | 0.221.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-document-load    | 0.66.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-fetch            | 0.221.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/instrumentation-xml-http-request | 0.221.0 | Copyright The OpenTelemetry Authors |
| @opentelemetry/resources                        | 2.10.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/sdk-trace-web                    | 2.10.0  | Copyright The OpenTelemetry Authors |
| @opentelemetry/semantic-conventions             | 1.43.0  | Copyright The OpenTelemetry Authors |
| amazon-cognito-identity-js                      | 6.3.20  | Copyright (c) Amazon.com, Inc.      |
| echarts                                         | 6.1.0   | Copyright Apache ECharts Authors    |
| firebase                                        | 12.17.0 | Copyright Google LLC                |
| keycloak-js                                     | 26.2.4  | Copyright Red Hat, Inc.             |
| typescript                                      | 6.0.3   | Copyright (c) Microsoft Corporation |

### ISC

| Package      | Version | Copyright                                        |
| ------------ | ------- | ------------------------------------------------ |
| lucide-react | 1.31.0  | Copyright (c) 2026 Lucide Icons and Contributors |

### MPL-2.0 OR Apache-2.0

| Package   | Version | Copyright            |
| --------- | ------- | -------------------- |
| dompurify | 3.4.13  | Copyright (c) Cure53 |

> `dompurify` is dual-licensed. This project elects the **Apache-2.0** option, so
> no MPL-2.0 source-disclosure obligation applies.

---

## Notes

> `vanilla-cookieconsent` is a peerDependency of `@granit/cookies-cookieconsent`.
>
> `@azure/msal-browser` is a peerDependency of `@granit/authentication-entraid`,
> `amazon-cognito-identity-js` is a peerDependency of `@granit/authentication-cognito`,
> and `firebase` is a peerDependency of `@granit/authentication-google-cloud`.
> These are installed in consumer applications that use the corresponding provider;
> the versions above are those resolved by this workspace's lockfile.

### TypeScript held at 6.x

`typescript` is deliberately pinned to `~6.0.3` rather than the current 7.0.2:

- `typescript-eslint` declares `typescript: >=4.8.4 <6.1.0` and refuses to load
  against TS 7 (`typescript-eslint does not support TS 7.0`), so `pnpm lint`
  cannot run. Support is tracked for TS >= 7.1.
- TS 7 removes the compiler API from the package entry point
  (`exports["."]` → `./lib/version.cjs`); the AST surface moved to the explicitly
  unstable `typescript/unstable/*` subpaths, which `@granit/contract-tests`
  depends on.

A matching `ignore` rule in `.github/dependabot.yml` prevents the major bump from
being reproposed until the ecosystem catches up.
