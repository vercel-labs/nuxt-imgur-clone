# AGENTS.md

Guidance for AI agents and humans working in this repo. Read `README.md` first for
setup and the overall picture; this file captures the runtime contract and the rules
that keep changes safe.

## What this is

An Imgur-style image host: paste, drop, or pick an image and get a shareable link.
Single Nuxt 4 project — browser uploader plus two Nitro server routes — backed by
Vercel Blob. No database.

## Project structure

- `app/app.vue` — root component; renders `<NuxtPage />` and holds shared page styles.
- `app/pages/index.vue` — the uploader (paste/drop/browse, progress, gallery).
- `app/pages/i/[name].vue` — the shareable preview page for one image.
- `server/api/upload.post.ts` — mints client-upload tokens with `handleUpload`.
- `server/api/image/[name].get.ts` — resolves blob metadata with `head`, sets CDN headers.
- `shared/utils/images.ts` — the single source of truth for image rules (auto-imported
  into both app and server by Nuxt).
- `nuxt.config.ts` — the Analytics module and the caching route rules.

## Commands

```sh
pnpm install
pnpm dev      # nuxt dev --dotenv .env.local (loads the Blob token)
pnpm build    # production build
```

## Environment

- `BLOB_READ_WRITE_TOKEN` is the only variable the app needs. It signs client-upload
  tokens on the server and must never reach the browser. Provisioned by
  `vercel blob create-store ... --access public`; pull locally with `vercel env pull .env.local`.
- OIDC (`VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`) is **not** sufficient — `handleUpload`
  requires the static read-write token to sign client tokens.

## Upload contract

- Uploads go **directly from the browser** to Vercel Blob via `upload()` from
  `@vercel/blob/client`, using `/api/upload` as the token endpoint. Bytes never pass
  through a Vercel Function (bypasses the 4.5 MB body limit).
- Blob pathnames are always `<10 alphanumeric chars>.<ext>` from `newImageName()`.
  Original filenames never leave the browser.
- `server/api/upload.post.ts` rejects any pathname that fails `IMAGE_NAME_RE` and embeds
  the content-type whitelist, the 10 MB size cap, and a 1-year `cacheControlMaxAge` into
  the signed token. Vercel Blob enforces those at upload time.
- The UI only ever exposes the app's own `/i/<name>` link. The raw blob URL is used as the
  `<img>` source and `og:image`, but is never shown as the shareable link.
- `server/api/image/[name].get.ts` returns 404 for missing or non-image blobs.

## Rules for changes

- **Keep `shared/utils/images.ts` the one source of truth.** The browser validates against
  it and the token route enforces it. Changing the allowed types, size cap, or name format
  on one side without the other breaks uploads. Update `IMAGE_NAME_RE` and `newImageName`
  together.
- **Storage is public-only by design.** Do not switch uploads to `access: 'private'` without
  also adding a server streaming route and an access check — private blobs are not
  web-accessible and give up the direct-CDN delivery path.
- **Do not surface the blob storage URL as the primary share link.** Hand out `/i/<name>`.
- **Preserve the caching model** unless intentionally changing it: `/` prerendered,
  `/i/**` ISR (`isr: 3600`), `/api/image/*` with `s-maxage`/`stale-while-revalidate`, and
  immutable blob URLs. These depend on names being random and never reused.
- **Uploads are anonymous by design.** Before deploying anywhere abuse matters, add an auth
  check inside `onBeforeGenerateToken` and pass identity via `tokenPayload`.

## Security

- Never commit secrets. Real values live in Vercel environment variables or local `.env*`
  files. Keep `.env.example` placeholder-only.
- Never commit `BLOB_READ_WRITE_TOKEN`, Vercel tokens, `.vercel/`, `node_modules`, or build
  output (`.nuxt`, `.output`).
