# Xenon<sup>self-hosted</sup>

Xenon<sup>self-hosted</sup> is a Dockerized, local-first Git workspace. It keeps the Xenon feel, but it does **not** depend on GitHub: repositories live on your own server, metadata is stored on disk, and clone endpoints are served by the app.

## Features

- Create local Git repositories from the web UI
- Browse repositories, files, README content, and recent commits
- Commit simple file changes from the browser
- Clone repositories over HTTP using dumb Git endpoints
- Persist everything in a mounted `/data` volume
- Self-hostable with Docker or Docker Compose

## Quick start with Docker Compose

```bash
docker compose up --build
```

Then open:

```txt
http://localhost:3000
```

Data is stored in the named Docker volume `xenon-data`.

## Clone a repository

After creating a repository named `demo`, clone it with:

```bash
git clone http://localhost:3000/git/demo.git
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `XENON_DATA_DIR` | `/data` in Docker, `.xenon-data` locally | Where repos, worktrees, and metadata live |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public URL used by metadata |
| `PORT` | `3000` | Web server port |

## Local development

```bash
bun install
bun run dev
```

## Scripts

- `bun dev` runs the dev server
- `bun run build` builds the app
- `bun run start` starts the production server
- `bun run lint` runs ESLint
- `bun run typecheck` runs TypeScript
- `bun run test` runs Vitest

## Notes

This version intentionally removes GitHub OAuth/API dependency. It is a standalone Git host designed for small self-hosted setups and homelabs.
