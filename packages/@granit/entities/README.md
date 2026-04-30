# @granit/entities

Framework-agnostic types and helpers for the Granit entity manifest.

## Why

The .NET backbone (`Granit.Entities.Abstractions` + `Granit.Entities.Endpoints`)
publishes a per-entity manifest at `GET /api/entities/{name}` describing forms,
details, lists, relations, and side panels. Any front-end that wants to render
those entities — React, mobile, or a future Vue app — needs a single source
of truth for the wire shape.

This package owns that source of truth, on the JavaScript side. It contains
no React, no fetch logic, no UI: just the TypeScript contracts plus a couple
of pure helpers (visibility-condition evaluator, type guards) that any
consumer can use.

## What's in here

- TypeScript types mirroring the `.NET` DTOs
  - `EntityDiscoveryResponse` and friends (`GET /api/entities`)
  - `EntityManifestResponse` + sub-sections (`GET /api/entities/{name}`)
  - Form / Detail / Field / Section / SidePanel / Relation descriptors
- Visibility DSL types + `evaluateVisibility(condition, formValues)` helper
- Runtime type guards used at the network boundary

The React renderer lives in [`@granit/react-entities`](../react-entities).

## Status

Scaffold only — implementation tracked under
[granit-fx/granit-front#298](https://github.com/granit-fx/granit-front/issues/298).
