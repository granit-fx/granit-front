import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import * as ts from 'typescript';

/** A single contract-conformance violation between a backend schema and a front type. */
export interface ConformanceViolation {
  /** Stable rule id (`missing-field`, `type-family`, `nullability`, `orphan-field`, …). */
  rule: string;
  /** Backend schema name being checked. */
  schema: string;
  /** Offending field (`*` for whole-type violations). */
  field: string;
  /** Human-readable explanation, ready to surface in an assertion message. */
  message: string;
}

/** Coarse type family — the level at which the contract (not the representation) is compared. */
type Family = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown';

/**
 * Brands the framework layers over primitives that OpenAPI can't express
 * (`@granit/types`). The contract is about the *family*, so a branded
 * `ISODateString` or `EntityId<…>` satisfies a `string` schema. Local type
 * aliases (e.g. `type FooId = EntityId<'Foo'>`, string-union enums) are
 * resolved automatically — only cross-package brands need to be listed here.
 */
const BRAND_FAMILY: Record<string, Family> = {
  ISODateString: 'string',
  EntityId: 'string',
  TenantId: 'string',
  UserId: 'string',
  CorrelationId: 'string',
  // Cross-package string-union enums (@granit/identity-abstractions) — the spec
  // serializes them as their string name, so they read as `string`.
  DeviceKind: 'string',
  UserSessionRiskLevel: 'string',
};

interface PropShape {
  family: Family;
  nullable: boolean;
}

// --- OpenAPI side ----------------------------------------------------------

interface OpenApiSchema {
  type?: string | string[];
  format?: string;
  nullable?: boolean;
  enum?: readonly unknown[];
  $ref?: string;
  required?: readonly string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
}

export interface OpenApiDocument {
  components?: { schemas?: Record<string, OpenApiSchema> };
}

/**
 * Normalization table — collapses the spec's representation warts to the curated
 * family the framework actually exposes:
 *   - `["integer","string"]` (int32/int64 serialized loosely) → `number`
 *   - `string` + `format: date-time|uuid`                     → `string`
 *   - string `enum` / const                                   → `string`
 *   - `["null", T]` / `nullable: true`                        → nullable
 */
type SchemaMap = Record<string, OpenApiSchema>;

function specFamily(
  schema: OpenApiSchema,
  schemas: SchemaMap,
  seen: ReadonlySet<string> = new Set()
): PropShape {
  let nullable = schema.nullable === true;
  let type = schema.type;
  if (Array.isArray(type)) {
    nullable = nullable || type.includes('null');
    type = type.find((t) => t !== 'null');
  }

  // Resolve $ref to the target schema's family (e.g. a ref to a string enum is
  // `string`, not `object`); guard against cycles.
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop() ?? schema.$ref;
    const target = seen.has(name) ? undefined : schemas[name];
    if (!target) return { family: 'object', nullable };
    const resolved = specFamily(target, schemas, new Set([...seen, name]));
    return { family: resolved.family, nullable: nullable || resolved.nullable };
  }

  let family: Family;
  if (schema.enum) family = 'string';
  else if (type === 'string') family = 'string';
  else if (type === 'integer' || type === 'number') family = 'number';
  else if (type === 'boolean') family = 'boolean';
  else if (type === 'array') family = 'array';
  else if (type === 'object') family = 'object';
  else family = 'unknown';

  return { family, nullable };
}

function specProps(
  schema: OpenApiSchema,
  schemas: SchemaMap
): Map<string, PropShape & { required: boolean }> {
  const required = new Set(schema.required ?? []);
  const out = new Map<string, PropShape & { required: boolean }>();
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    out.set(name, { ...specFamily(prop, schemas), required: required.has(name) });
  }
  return out;
}

// --- TypeScript side -------------------------------------------------------

type AliasMap = ReadonlyMap<string, ts.TypeNode>;

function isNullish(node: ts.TypeNode): boolean {
  return (
    node.kind === ts.SyntaxKind.NullKeyword ||
    node.kind === ts.SyntaxKind.UndefinedKeyword ||
    (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword)
  );
}

/**
 * `unknown` / `any` subsume `null | undefined`, so a field of that type already
 * tolerates a nullable backend value — reading it as non-nullable would flag a
 * phantom drift on opaque payloads (e.g. a JsonElement mirrored as `unknown`).
 */
function isUnknownLike(node: ts.TypeNode): boolean {
  return node.kind === ts.SyntaxKind.UnknownKeyword || node.kind === ts.SyntaxKind.AnyKeyword;
}

function familyOfLiteralType(node: ts.LiteralTypeNode): Family {
  const lit = node.literal.kind;
  if (lit === ts.SyntaxKind.StringLiteral) return 'string';
  if (lit === ts.SyntaxKind.NumericLiteral) return 'number';
  if (lit === ts.SyntaxKind.TrueKeyword || lit === ts.SyntaxKind.FalseKeyword) return 'boolean';
  return 'unknown';
}

function familyOfIntersection(
  node: ts.IntersectionTypeNode,
  aliases: AliasMap,
  seen: ReadonlySet<string>
): Family {
  for (const member of node.types) {
    const fam = familyOf(member, aliases, seen);
    if (fam !== 'object' && fam !== 'unknown') return fam;
  }
  return 'object';
}

function familyOfTypeReference(
  node: ts.TypeReferenceNode,
  aliases: AliasMap,
  seen: ReadonlySet<string>
): Family {
  const name = node.typeName.getText();
  if (name === 'Array' || name === 'ReadonlyArray') return 'array';
  const brand = BRAND_FAMILY[name];
  if (brand) return brand;
  const alias = aliases.get(name);
  if (alias && !seen.has(name)) return familyOf(alias, aliases, new Set([...seen, name]));
  return 'object';
}

/**
 * Coarse family of a type node, resolving framework brands and local type
 * aliases (`type FooId = EntityId<'Foo'>`, string-union enums) so a branded
 * string still reads as `string`. `seen` guards against alias cycles.
 */
function familyOf(
  node: ts.TypeNode,
  aliases: AliasMap,
  seen: ReadonlySet<string> = new Set()
): Family {
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) {
    return familyOf(node.type, aliases, seen);
  }
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    default:
      break;
  }
  if (ts.isArrayTypeNode(node)) return 'array';
  if (ts.isLiteralTypeNode(node)) return familyOfLiteralType(node);
  if (ts.isUnionTypeNode(node)) {
    const base = node.types.find((t) => !isNullish(t));
    return base ? familyOf(base, aliases, seen) : 'unknown';
  }
  // Brand pattern `string & { __brand }` — the primitive member wins.
  if (ts.isIntersectionTypeNode(node)) return familyOfIntersection(node, aliases, seen);
  if (ts.isTypeReferenceNode(node)) return familyOfTypeReference(node, aliases, seen);
  if (ts.isTypeLiteralNode(node)) return 'object';
  return 'unknown';
}

function tsFamily(typeNode: ts.TypeNode, aliases: AliasMap): PropShape {
  if (!ts.isUnionTypeNode(typeNode))
    return { family: familyOf(typeNode, aliases), nullable: isUnknownLike(typeNode) };
  let nullable = false;
  const bases: ts.TypeNode[] = [];
  for (const member of typeNode.types) {
    if (isNullish(member)) nullable = true;
    else bases.push(member);
  }
  const first = bases[0];
  return { family: first ? familyOf(first, aliases) : 'unknown', nullable };
}

interface ParsedSource {
  /**
   * DTO members — from an `interface X {}`, a `type X = {…}` object-literal
   * alias, or a `type X = Y<…>` alias resolved to its (possibly cross-package,
   * possibly generic) target.
   */
  members?: readonly ts.TypeElement[];
  aliases: AliasMap;
}

/**
 * A named type declaration the oracle can flatten to a member list — an
 * `interface`, an object-literal `type` alias, or a `type X = Y<…>` alias that
 * forwards to one (possibly generic, possibly cross-package). `typeParams` lets
 * a generic instantiation bind its arguments by position.
 */
interface SymbolDecl {
  readonly typeParams: readonly string[];
  /** Present for an interface or an object-literal alias. */
  readonly members?: readonly ts.TypeElement[];
  /** Present for an alias that forwards to another named type. */
  readonly aliasTarget?: ts.TypeNode;
}
type DeclMap = ReadonlyMap<string, SymbolDecl>;

/**
 * Per-file local type aliases + the module specifiers it imports / re-exports.
 * Cached process-wide so the dependency graph is parsed at most once across the
 * whole suite, however many DTOs reference a shared file.
 */
interface FileInfo {
  aliases: ReadonlyMap<string, ts.TypeNode>;
  decls: ReadonlyMap<string, SymbolDecl>;
  imports: readonly string[];
}
const fileInfoCache = new Map<string, FileInfo>();
const MAX_IMPORT_DEPTH = 8;
const RESOLVE_EXTS = ['.ts', '.tsx'] as const;

function parseInfo(fileName: string, sourceText: string): FileInfo {
  const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const aliases = new Map<string, ts.TypeNode>();
  const decls = new Map<string, SymbolDecl>();
  const imports: string[] = [];
  sf.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      aliases.set(node.name.text, node.type);
      const typeParams = node.typeParameters?.map((p) => p.name.text) ?? [];
      decls.set(
        node.name.text,
        ts.isTypeLiteralNode(node.type)
          ? { typeParams, members: node.type.members }
          : { typeParams, aliasTarget: node.type }
      );
    } else if (ts.isInterfaceDeclaration(node)) {
      decls.set(node.name.text, {
        typeParams: node.typeParameters?.map((p) => p.name.text) ?? [],
        members: node.members,
      });
    } else if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
  });
  return { aliases, decls, imports };
}

/**
 * Cached per-file parse — keyed by path, so an imported file is parsed once
 * across the whole suite. Only safe for files read from disk (stable content);
 * the entry file is parsed fresh by {@link collectSymbols} since its source text
 * is supplied per call and may differ from any cached version.
 */
function parseFileInfo(fileName: string, sourceText: string): FileInfo {
  const cached = fileInfoCache.get(fileName);
  if (cached) return cached;
  const info = parseInfo(fileName, sourceText);
  fileInfoCache.set(fileName, info);
  return info;
}

/** Resolve a relative or `@granit/*` module specifier to its on-disk source file. */
function resolveModuleFile(spec: string, fromFile: string): string | undefined {
  let base: string;
  if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else if (spec.startsWith('@granit/')) {
    const marker = `${path.sep}packages${path.sep}@granit${path.sep}`;
    const idx = fromFile.indexOf(marker);
    if (idx === -1) return undefined;
    const repoPackages = fromFile.slice(0, idx + marker.length);
    base = path.join(repoPackages, spec.slice('@granit/'.length), 'src', 'index');
  } else {
    return undefined; // node_modules / unrelated package — nothing to resolve
  }
  for (const ext of RESOLVE_EXTS) if (existsSync(base + ext)) return base + ext;
  for (const ext of RESOLVE_EXTS) {
    const idxFile = path.join(base, `index${ext}`);
    if (existsSync(idxFile)) return idxFile;
  }
  return undefined;
}

/**
 * Merge the entry file's type aliases with those reachable through its
 * `import type` / `export … from` edges. The codebase keeps each string-union
 * enum in its own file, so a field typed as an imported enum must follow the
 * import to resolve to its real family instead of defaulting to `object`.
 * Local aliases win; cycles and depth are bounded.
 */
interface ImportFrame {
  file: string;
  text: string;
  depth: number;
}

/** Resolve and enqueue the `import type` targets of one file, skipping cycles and unreadable modules. */
function enqueueImports(
  info: FileInfo,
  file: string,
  depth: number,
  visited: ReadonlySet<string>,
  stack: ImportFrame[]
): void {
  for (const spec of info.imports) {
    const target = resolveModuleFile(spec, file);
    if (!target || visited.has(target)) continue;
    try {
      stack.push({ file: target, text: readFileSync(target, 'utf8'), depth: depth + 1 });
    } catch {
      // unreadable (generated / out-of-tree) — skip silently
    }
  }
}

function collectSymbols(
  fileName: string,
  sourceText: string
): { aliases: AliasMap; decls: DeclMap } {
  const aliases = new Map<string, ts.TypeNode>();
  const decls = new Map<string, SymbolDecl>();
  const visited = new Set<string>();
  const stack: ImportFrame[] = [{ file: fileName, text: sourceText, depth: 0 }];
  while (stack.length) {
    const { file, text, depth } = stack.pop()!;
    if (visited.has(file) || depth > MAX_IMPORT_DEPTH) continue;
    visited.add(file);
    // The entry file (depth 0) carries caller-supplied source text that may
    // differ from any cached parse — parse it fresh; cache only imports.
    const info = depth === 0 ? parseInfo(file, text) : parseFileInfo(file, text);
    for (const [name, node] of info.aliases) if (!aliases.has(name)) aliases.set(name, node);
    for (const [name, decl] of info.decls) if (!decls.has(name)) decls.set(name, decl);
    enqueueImports(info, file, depth, visited, stack);
  }
  return { aliases, decls };
}

/**
 * Resolve a (possibly generic, possibly cross-package) type name to its member
 * list, binding each type parameter to its positional argument. The bindings
 * are injected into the alias map so a field typed as a bare type parameter
 * (`loserId: TId`) resolves through to the concrete argument's family
 * (`PartyId` → branded string). Returns `undefined` for shapes the oracle still
 * cannot flatten field-by-field (unions, mapped types, unresolved externals).
 */
function resolveDeclMembers(
  name: string,
  typeArgs: readonly ts.TypeNode[],
  decls: DeclMap,
  aliases: AliasMap,
  depth = 0
): { members: readonly ts.TypeElement[]; aliases: AliasMap } | undefined {
  if (depth > MAX_IMPORT_DEPTH) return undefined;
  const decl = decls.get(name);
  if (!decl) return undefined;
  const bound = new Map(aliases);
  decl.typeParams.forEach((param, i) => {
    const arg = typeArgs[i];
    if (arg) bound.set(param, arg);
  });
  if (decl.members) return { members: decl.members, aliases: bound };
  if (decl.aliasTarget && ts.isTypeReferenceNode(decl.aliasTarget)) {
    return resolveDeclMembers(
      decl.aliasTarget.typeName.getText(),
      decl.aliasTarget.typeArguments ?? [],
      decls,
      bound,
      depth + 1
    );
  }
  return undefined;
}

function parseSource(sourceText: string, fileName: string, typeName: string): ParsedSource {
  const { aliases, decls } = collectSymbols(fileName, sourceText);
  const resolved = resolveDeclMembers(typeName, [], decls, aliases);
  return { members: resolved?.members, aliases: resolved?.aliases ?? aliases };
}

function tsProps(members: readonly ts.TypeElement[], aliases: AliasMap): Map<string, PropShape> {
  const out = new Map<string, PropShape>();
  for (const member of members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const shape = tsFamily(member.type, aliases);
    out.set(member.name.getText(), {
      family: shape.family,
      nullable: shape.nullable || member.questionToken !== undefined,
    });
  }
  return out;
}

// --- Oracle ----------------------------------------------------------------

export interface CheckSchemaOptions {
  /** Parsed OpenAPI document (a vendored `contracts/openapi/<module>.json`). */
  spec: OpenApiDocument;
  /** Schema name in `components.schemas`. */
  schemaName: string;
  /** Raw text of the TS file declaring the front type. */
  sourceText: string;
  /** Path of that file (used in messages and TS parsing). */
  fileName: string;
  /** Front interface name. Defaults to `schemaName`. */
  typeName?: string;
}

function compareField(
  schemaName: string,
  name: string,
  sp: PropShape & { required: boolean },
  tp: PropShape
): ConformanceViolation[] {
  const out: ConformanceViolation[] = [];
  if (sp.family !== 'unknown' && tp.family !== 'unknown' && sp.family !== tp.family) {
    out.push({
      rule: 'type-family',
      schema: schemaName,
      field: name,
      message: `field "${name}": backend is ${sp.family}, front is ${tp.family}`,
    });
  }
  if (sp.nullable && !tp.nullable) {
    out.push({
      rule: 'nullability',
      schema: schemaName,
      field: name,
      message: `field "${name}": backend allows null, front type does not`,
    });
  }
  return out;
}

/**
 * Verify a hand-written front interface conforms to its backend OpenAPI schema —
 * field presence, nullability and coarse type family — while tolerating the
 * spec's representation (int unions, branded primitives, materialized generics)
 * via the normalization table. Returns one {@link ConformanceViolation} per drift;
 * an empty array means the front type still mirrors the contract.
 */
export function checkSchemaConformance(opts: CheckSchemaOptions): ConformanceViolation[] {
  const typeName = opts.typeName ?? opts.schemaName;

  const schema = opts.spec.components?.schemas?.[opts.schemaName];
  if (!schema) {
    return [
      {
        rule: 'schema-missing',
        schema: opts.schemaName,
        field: '*',
        message: `the spec has no schema "${opts.schemaName}"`,
      },
    ];
  }

  const { members, aliases } = parseSource(opts.sourceText, opts.fileName, typeName);
  if (!members) {
    return [
      {
        rule: 'type-missing',
        schema: opts.schemaName,
        field: '*',
        message: `front type "${typeName}" not found in ${opts.fileName}`,
      },
    ];
  }

  const backend = specProps(schema, opts.spec.components?.schemas ?? {});
  const front = tsProps(members, aliases);
  const out: ConformanceViolation[] = [];

  for (const [name, sp] of backend) {
    const tp = front.get(name);
    if (!tp) {
      if (sp.required) {
        out.push({
          rule: 'missing-field',
          schema: opts.schemaName,
          field: name,
          message: `backend field "${name}" (${sp.family}) is missing from the front type`,
        });
      }
      continue;
    }
    out.push(...compareField(opts.schemaName, name, sp, tp));
  }

  for (const name of front.keys()) {
    if (!backend.has(name)) {
      out.push({
        rule: 'orphan-field',
        schema: opts.schemaName,
        field: name,
        message: `front field "${name}" has no counterpart in the backend schema (drift?)`,
      });
    }
  }

  // Field order — compare the relative order of shared fields only (missing /
  // orphan fields are already reported above; they must not skew the position
  // check). A mismatch here means a C# record parameter was reordered without
  // updating the TS interface, or a field was inserted in the wrong place.
  const sharedInSpec = [...backend.keys()].filter((k) => front.has(k));
  const sharedInFront = [...front.keys()].filter((k) => backend.has(k));
  if (sharedInSpec.join('\0') !== sharedInFront.join('\0')) {
    out.push({
      rule: 'field-order',
      schema: opts.schemaName,
      field: '*',
      message: `field order differs — spec: [${sharedInSpec.join(', ')}], front: [${sharedInFront.join(', ')}]`,
    });
  }

  return out;
}
