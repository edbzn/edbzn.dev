# Blog ideas worker

Tiny Cloudflare Worker backing the `<BlogIdeas />` component.

## Setup

```sh
cd worker
pnpm install
# create KV namespaces (prints ids you paste into wrangler.toml)
pnpm exec wrangler kv namespace create BLOG_IDEAS
pnpm exec wrangler kv namespace create BLOG_IDEAS --preview
```

Paste the returned `id` and `preview_id` into `wrangler.toml`.

## Run locally

```sh
pnpm dev
# → http://127.0.0.1:8787
```

Set `GATSBY_IDEAS_API=http://127.0.0.1:8787` in the Gatsby site's `.env.development`
so the component hits the local worker.

## Deploy

```sh
pnpm deploy
```

Then set `GATSBY_IDEAS_API=https://<your-worker>.workers.dev` (or a custom
route) for production builds.

## API

- `GET  /votes`         → `{ [id]: count }`
- `GET  /votes/:id`     → `{ id, count }`
- `POST /vote/:id`      → `{ id, count, voted }`

Dedup: one vote per `(CF-Connecting-IP, id)` for 30 days. Ids must match
`^[a-z0-9][a-z0-9-]{0,63}$`.
