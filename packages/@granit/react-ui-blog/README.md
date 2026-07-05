# @granit/react-ui-blog

Admin authoring UI for the Granit **Blog** module. Composes the headless
[`@granit/react-blog`](../react-blog) hooks with the foundation UI packages
(`@granit/react-ui`, `@granit/react-ui-kit`) — posts grid, per-culture Puck
content editor, media gallery, publish/schedule lifecycle, and author-profile
CRUD.

Published package (tsup build, `dist/`).

## Screens

| Export                              | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `PostsListPage`                     | QueryEngine grid over `/grid`, permission-gated row actions             |
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

These screens only call hooks — the host app must provide the providers:

```tsx
<AuthorizationProvider config={{ client }}>
  {' '}
  {/* permission gating */}
  <BlogProvider config={{ client }}>
    {' '}
    {/* Blog hooks */}
    <CmsProvider config={{ client }}>
      {' '}
      {/* block catalog for the editor */}
      <DocumentsProvider config={{ client }}>
        {' '}
        {/* media pickers */}
        <Routes>
          <Route path="/blog/posts" element={<PostsListPage />} />
          <Route path="/blog/posts/new" element={<PostEditorPage siteId={siteId} />} />
          <Route
            path="/blog/posts/:id/edit"
            element={<PostEditorPage cultures={site.allowedCultures} />}
          />
          <Route path="/blog/authors" element={<AuthorsListPage siteId={siteId} />} />
          <Route path="/blog/authors/new" element={<AuthorFormPage siteId={siteId} />} />
          <Route path="/blog/authors/:id/edit" element={<AuthorFormPage siteId={siteId} />} />
        </Routes>
      </DocumentsProvider>
    </CmsProvider>
  </BlogProvider>
</AuthorizationProvider>
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
