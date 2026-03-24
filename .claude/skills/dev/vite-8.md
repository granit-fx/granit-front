# Vite 8 + React 19 Reference

Vite 8 (released March 2026) replaces the dual-bundler architecture (esbuild + Rollup)
with a unified **Rolldown** bundler and **Oxc** compiler. `@vitejs/plugin-react` v6
removes Babel entirely.

---

## Architecture change

| Component            | Vite 7                        | Vite 8                      |
| -------------------- | ----------------------------- | --------------------------- |
| JS/TS transformation | esbuild                       | **Oxc**                     |
| Bundler (dev + prod) | esbuild (dev) + Rollup (prod) | **Rolldown** (unified)      |
| Dep optimization     | esbuild                       | **Rolldown**                |
| JS minification      | esbuild                       | **Oxc Minifier**            |
| CSS minification     | esbuild                       | **Lightning CSS** (default) |
| React JSX            | Babel (via plugin-react)      | **Oxc** (native, no Babel)  |

Result: **10-30x faster builds** in real-world benchmarks.

---

## Node.js and browser requirements

- **Node.js**: 20.19+ or 22.12+
- **Browser targets**: Chrome 111+, Firefox 114+, Safari 16.4+

---

## Configuration migration

### esbuild to Oxc

```typescript
// Vite 7 (deprecated, auto-converted)
export default defineConfig({
  esbuild: {
    target: 'esnext',
    jsx: 'automatic',
    jsxImportSource: 'react',
    define: { 'process.env.NODE_ENV': '"production"' },
  },
});

// Vite 8
export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'react' },
    define: { 'process.env.NODE_ENV': '"production"' },
  },
});
```

**JSX option mapping:**

| esbuild (deprecated) | Oxc                             |
| -------------------- | ------------------------------- |
| `jsx: "preserve"`    | `jsx: "preserve"`               |
| `jsx: "automatic"`   | `jsx: { runtime: "automatic" }` |
| `jsx: "transform"`   | `jsx: { runtime: "classic" }`   |
| `jsxImportSource`    | `jsx.importSource`              |
| `jsxFactory`         | `jsx.pragma`                    |
| `define`             | `define` (same)                 |

### Rollup to Rolldown

```typescript
// Vite 7 (deprecated, auto-converted)
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["react"],
      output: { manualChunks: (id) => ... },
    },
  },
});

// Vite 8
export default defineConfig({
  build: {
    rolldownOptions: {
      external: ["react"],
      output: { manualChunks: (id) => ... },
    },
  },
});
```

### Dep optimization

```typescript
// Vite 7 (deprecated)
optimizeDeps: { esbuildOptions: { ... } }

// Vite 8
optimizeDeps: { rolldownOptions: { ... } }
```

---

## @vitejs/plugin-react v6

### Breaking changes

1. **Babel removed entirely.** Oxc handles React Refresh natively.
2. **Vite 7 and below not supported.** Requires Vite 8+.

### Migration for Babel users

If you used `babel` options in the plugin config:

```typescript
// Vite 7
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-styled-components'],
      },
    }),
  ],
});

// Vite 8 — use @rolldown/plugin-babel separately
import react from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [
    react(),
    babel({
      plugins: ['babel-plugin-styled-components'],
    }),
  ],
});
```

### React Compiler preset

```typescript
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
```

---

## New features

### Built-in tsconfig paths resolution

Replaces `vite-tsconfig-paths` plugin:

```typescript
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
});
```

Reads `tsconfig.json` `paths` at runtime. If you migrate away from `baseUrl`
(deprecated in TS 6) to full relative paths in `paths`, Vite picks it up
automatically.

### Forward browser console to CLI

```typescript
export default defineConfig({
  server: {
    forwardConsole: true, // Auto-activates with coding agents
  },
});
```

### Integrated devtools

```typescript
export default defineConfig({
  devtools: true,
});
```

### WebAssembly in SSR

```typescript
import init from './module.wasm?init';
```

---

## Removed and unsupported features

- `esbuild.supported` option — not available in Oxc
- Property mangling options — not supported by Oxc
- `build.commonjsOptions` — now a no-op
- Object form of `output.manualChunks` — use function form
- Output formats `"system"` and `"amd"` — unsupported
- `resolve.alias[].customResolver` — use plugin with `resolveId` + `enforce: "pre"`
- Plugin hooks removed: `shouldTransformCachedModule`, `resolveImportMeta`,
  `renderDynamicImport`, `resolveFileUrl`

---

## Oxc known limitations

- Native decorator lowering not yet supported — use `@rolldown/plugin-babel` or
  `@rollup/plugin-swc` if needed
- TypeScript legacy `namespace` only partially supported — prefer `namespace` over
  legacy `module` keyword (TS 6 deprecates `module` anyway)
- `emitDecoratorMetadata` only partially supported
- Isolated declarations partially supported

---

## Recommended Vite 8 config (granit-front consumer apps)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    forwardConsole: true,
  },
  build: {
    target: 'es2025',
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
```

---

## TypeScript 6 + Vite 8 compatibility

Vite does **not** type-check code — it strips types via Oxc. TypeScript version
changes primarily affect `tsc --noEmit` checks, not the Vite dev server or build.

Key points:

- TS 6 `module: "esnext"` and `moduleResolution: "bundler"` align perfectly with Vite
- TS 6 `types: []` default means you must declare `"types": ["vite/client"]` in
  tsconfig for Vite client types
- TS 6 `import ... with` syntax (replacing `assert`) is supported by Oxc
- `verbatimModuleSyntax: true` continues to be respected
- `isolatedModules: true` still required for Vite (not removed in TS 6)

---

## React 19 features relevant to Vite 8

### `use()` hook

Read promises and contexts directly in render:

```typescript
import { use, Suspense } from "react";

function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
  return comments.map((c) => <p key={c.id}>{c.text}</p>);
}

// Wrap in Suspense
<Suspense fallback={<Spinner />}>
  <Comments commentsPromise={fetchComments()} />
</Suspense>
```

### Actions (form handling)

```typescript
function UpdateName() {
  const [error, submitAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const error = await updateName(formData.get("name") as string);
      if (error) return error;
      redirect("/profile");
      return null;
    },
    null,
  );

  return (
    <form action={submitAction}>
      <input name="name" />
      <button disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### `useOptimistic`

```typescript
function MessageThread({ messages }: { messages: Message[] }) {
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (state, newMsg: string) => [...state, { text: newMsg, sending: true }],
  );

  async function send(formData: FormData) {
    const text = formData.get("text") as string;
    addOptimistic(text);
    await sendMessage(text);
  }

  return (
    <>
      {optimistic.map((msg, i) => (
        <p key={i} style={{ opacity: msg.sending ? 0.5 : 1 }}>{msg.text}</p>
      ))}
      <form action={send}>
        <input name="text" />
      </form>
    </>
  );
}
```

### Document metadata in components

```typescript
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.summary} />
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### `ref` as a prop (no more `forwardRef`)

```typescript
// React 19 — ref is a regular prop
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}

// No more forwardRef needed
<Input ref={inputRef} />
```

### Stylesheet precedence

```typescript
function Component() {
  return (
    <>
      <link rel="stylesheet" href="/styles/base.css" precedence="default" />
      <link rel="stylesheet" href="/styles/theme.css" precedence="high" />
      <div>Content</div>
    </>
  );
}
```
