# @granit/react-ui-blog

Admin authoring UI for the Granit **Blog** module. Composes the headless
[`@granit/react-blog`](../react-blog) hooks with the foundation UI packages
(`@granit/react-ui`, `@granit/react-ui-kit`) — posts list, per-culture Puck
content editor, media gallery, publish/schedule lifecycle, and author-profile
CRUD.

Published package (tsup build, `dist/`).

## Screens

| Export                              | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `PostsListPage`                     | QueryEngine list over `/posts`, permission-gated row actions            |
| `PostEditorPage`                    | Create/edit orchestration — metadata / content / media / lifecycle tabs |
| `PostMetadataForm`                  | Slug, author picker, cover image; spec-validated                        |
| `PostContentEditor`                 | Per-culture draft authoring with the embedded Puck editor               |
| `PostGalleryEditor`                 | Add / describe / remove / reorder attachments                           |
| `PostLifecyclePanel`                | Publish / unpublish / schedule (IANA tz) / cancel                       |
| `PostConflictDialog`                | `409` reload prompt (stale stamp / slug conflict)                       |
| `AuthorsListPage`, `AuthorFormPage` | Author-profile CRUD                                                     |
| `DocumentPickerButton`              | Cover / avatar / attachment picker (Documents)                          |

Plus `createPostsColumns` and the `blogTranslationsEn` / `blogTranslationsFr`
i18next bundles.

## Host wiring

These screens only call hooks and are **router-agnostic** — navigation flows
through callback props / ids, so the host owns routing (React Router, React
Navigation, …). The host provides the providers:

- `AuthorizationProvider` — permission gating
- `BlogProvider` — Blog hooks
- `CmsProvider` — block catalog for the editor
- `DocumentsProvider` — media pickers

```tsx
// Inside the host's own router:
<PostsListPage onNewPost={() => nav('/blog/posts/new')} onEditPost={(id) => nav(`/blog/posts/${id}/edit`)} />
<PostEditorPage siteId={siteId} onBack={() => nav('/blog/posts')} onSaved={(p) => nav(`/blog/posts/${p.id}/edit`)} />
<PostEditorPage postId={id} cultures={site.allowedCultures} onBack={() => nav('/blog/posts')} />
<AuthorsListPage siteId={siteId} onNewAuthor={() => nav('/blog/authors/new')} onEditAuthor={(id) => nav(`/blog/authors/${id}/edit`)} />
<AuthorFormPage siteId={siteId} onDone={() => nav('/blog/authors')} onCancel={() => nav('/blog/authors')} />
<AuthorFormPage siteId={siteId} authorId={id} onDone={() => nav('/blog/authors')} onCancel={() => nav('/blog/authors')} />
```

Register the locale bundles: `i18n.addResourceBundle('en', 'translation', blogTranslationsEn, true, true)`.

## Notes

- The content editor loads the CMS block catalog (`getBlockCatalog`) and builds a
  Puck config via `catalogToConfig` + `registerBlogBlocks` — the same catalog CMS
  pages use, no second editor.
- Reorder posts the **full** ordered attachment id set (the backend rejects a
  partial set with `InvalidAttachmentOrder`).
- Form validation derives from `blogConstraints` (`@granit/blog`) via
  `createConstraintsResolver`.
