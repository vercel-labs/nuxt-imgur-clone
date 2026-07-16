# GoodImg — Imgur-style image hosting with Nuxt and Vercel Blob

Paste, drop, or pick an image and get a shareable link back in seconds. A single
[Nuxt 4](https://nuxt.com) app backed by [Vercel Blob](https://vercel.com/docs/vercel-blob),
with direct-to-storage client uploads, shareable preview pages, and CDN caching at every
layer. No database.

## Features

- **Paste / drop / browse** — ⌘V anywhere on the page, drag and drop, or a file picker.
- **Direct client uploads** — files stream straight from the browser to Vercel Blob, so
  they bypass the 4.5 MB serverless body limit (10 MB cap here, configurable).
- **Images only** — PNG, JPG, WebP, GIF, enforced in the browser *and* inside the signed
  upload token, so nothing else can land in the store.
- **Random, private-by-default names** — blobs are stored under random 10-character
  [nanoid](https://github.com/ai/nanoid) names; original filenames never leave the browser.
- **Shareable preview pages** — every upload gets an `/i/<name>` page with the image,
  metadata, a copy button, and Open Graph tags for link unfurls.
- **Edge caching everywhere** — prerendered home page, ISR preview pages, cached metadata
  API, and immutable year-long blob caching.
- **Web Analytics** — pageviews plus custom events for uploads, rejections, and link copies.

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Nuxt 4 (Vue 3, Nitro server)                                  |
| Storage    | Vercel Blob (`@vercel/blob`)                                  |
| Naming     | nanoid                                                        |
| Analytics  | Vercel Web Analytics (`@vercel/analytics`)                    |
| Hosting    | Vercel                                                        |

## Project structure

```
.
├── app/
│   ├── app.vue                    # root component: <NuxtPage /> + shared page styles
│   └── pages/
│       ├── index.vue              # uploader: paste/drop/browse, progress, gallery
│       └── i/[name].vue           # shareable preview page for one image
├── server/
│   └── api/
│       ├── upload.post.ts         # mints client-upload tokens (handleUpload)
│       └── image/[name].get.ts    # resolves blob metadata (head) + sets CDN headers
├── shared/
│   └── utils/
│       └── images.ts              # single source of truth: allowed types, size cap,
│                                  #   nanoid naming, name regex (auto-imported both sides)
├── nuxt.config.ts                 # Analytics module + caching route rules
├── .env.example                   # BLOB_READ_WRITE_TOKEN placeholder
└── AGENTS.md                      # runtime contract & change rules
```

Nuxt auto-imports `shared/utils/` into both the app and the server, which is why the image
rules live there once and are enforced on both sides.

## Getting started

### Prerequisites

- Node.js 22+ and [pnpm](https://pnpm.io/)
- A [Vercel account](https://vercel.com/signup) and the CLI (`npm i -g vercel`)

### Setup

```bash
pnpm install
vercel link                                              # link to a Vercel project
vercel blob create-store goodimg-images --access public --yes   # creates store + pulls .env.local
pnpm dev                                                 # loads .env.local via --dotenv
```

Open [http://localhost:3000](http://localhost:3000) and paste an image.

The only required environment variable is `BLOB_READ_WRITE_TOKEN` — provisioned
automatically by `create-store` (or copy it from the store's settings in the dashboard,
see [.env.example](.env.example)). It signs client-upload tokens on the server and never
reaches the browser.

> Two things behave differently on localhost: the `onUploadCompleted` webhook can't reach
> your machine (use a tunnel and `VERCEL_BLOB_CALLBACK_URL` to test it), and ISR route
> rules are ignored in dev.

## How it works

- **[app/pages/index.vue](app/pages/index.vue)** — uploader with idle/drag/uploading/done
  states. Uploads straight from the browser with `upload()` from `@vercel/blob/client`,
  driving the progress bar with the SDK's `onUploadProgress` callback, and hands out
  `/i/<name>` links.
- **[server/api/upload.post.ts](server/api/upload.post.ts)** — mints short-lived
  client-upload tokens with `handleUpload()`. Validates the pathname against the nanoid
  format and embeds the type whitelist, 10 MB cap, and 1-year cache into the token.
- **[app/pages/i/[name].vue](app/pages/i/%5Bname%5D.vue)** — preview page: renders the
  image with type/size/date, a copy button for the `/i/<name>` link, Open Graph tags, and
  a styled not-found state.
- **[server/api/image/[name].get.ts](server/api/image/%5Bname%5D.get.ts)** — resolves blob
  metadata via `head()`, 404s for missing or non-image blobs, and sets CDN cache headers.
- **[shared/utils/images.ts](shared/utils/images.ts)** — allowed types, size cap, nanoid
  name generator, and the `IMAGE_NAME_RE` the server enforces.

> Uploads are unauthenticated by design (Imgur-style anonymous hosting). To lock it down,
> add an auth check in `onBeforeGenerateToken` — see
> [authenticating client uploads](https://vercel.com/docs/vercel-blob/client-upload#authenticating-client-uploads).

## Edge caching / CDN

| Route             | Strategy                                                       |
| ----------------- | -------------------------------------------------------------- |
| `/`               | Prerendered at build, served static from the edge             |
| `/i/**`           | ISR, 1-hour edge cache with background refresh                 |
| `/api/image/*`    | `public, max-age=0, s-maxage=86400, stale-while-revalidate=604800` |
| Blob image URLs   | Immutable, `cacheControlMaxAge` of 1 year                      |
| `/_nuxt/*`        | Fingerprinted, immutable (automatic)                           |

Because blob names are random and never reused, blob URLs are immutable — which is what
makes the aggressive caching safe.

## Analytics

[Vercel Web Analytics](https://vercel.com/docs/analytics) is wired up via the
`@vercel/analytics` Nuxt module (pageviews are automatic), plus custom events:

| Event                    | Fired from | Properties                             |
| ------------------------ | ---------- | -------------------------------------- |
| `image_uploaded`         | client     | `method` (paste/drop/browse), `type`, `sizeKb` |
| `upload_rejected`        | client     | `reason` (unsupported_type/too_large), `type` |
| `upload_failed`          | client     | `method`, `type`                       |
| `link_copied`            | client     | `surface` (uploader/preview)           |
| `image_upload_completed` | server (`onUploadCompleted` webhook) | `contentType` |

Enable Web Analytics in the Vercel dashboard (project → Analytics → Enable) before
deploying. Custom events require a Pro or Enterprise plan; in local dev, events are logged
to the browser console in debug mode instead of being sent.

## Deploy

```bash
vercel deploy        # preview
vercel deploy --prod # production
```

The Blob store is already connected to the linked project, so deployed environments get
`BLOB_READ_WRITE_TOKEN` automatically.

## License

MIT
