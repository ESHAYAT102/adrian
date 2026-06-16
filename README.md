# Adrian

Adrian is the Xenon experience rebuilt on top of its own self-hosted Git system. It keeps the profile, repository browsing, command palette, file viewer/editor, and dashboard feel from Xenon, but removes the GitHub dependency: users create local Adrian accounts, repositories live on your own server, and clone endpoints are served by the app.

See a demo [here](https://adrian.eshayat.com)

## Features

- Local Adrian user accounts — no GitHub OAuth required
- User-owned repositories at `/:username/:repo`
- Create local Git repositories from the web UI
- Browse repositories, files, README content, commits, profiles, and activity
- Commit simple file changes from the browser
- Clone repositories over HTTP with GitHub-style URLs like `/:username/:repo.git`
- Persist everything in a mounted `/data` volume
- Self-hostable with Docker or Docker Compose

## Quick start with Docker Compose

```bash
git clone https://github.com/ESHAYAT102/adrian.git
cd adrian
bun i
docker compose up --build
```

Then open:

```txt
http://localhost:8390
```

Data is stored in the named Docker volume `adrian-data`.

## Clone a repository

After creating user `eshayat` and repository `cool-cli`, clone it with:

```bash
git clone http://localhost:8390/eshayat/cool-cli.git
```

## Push to a repository

After making changes to the code, push it with:

```bash
git push -u origin main
Username: # Put your username here. In this case, 'eshayat'
Password: # Put that account's password here, no keys
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `ADRIAN_DATA_DIR` | `/data` in Docker, `.adrian-data` locally | Where repos, worktrees, users, and metadata live |
| `ADRIAN_SESSION_SECRET` | `adrian-local-docker-secret-change-me` in Docker | Cookie encryption secret; change this for real deployments |
| `ADRIAN_COOKIE_SECURE` | unset | Set to `true` only when serving Adrian over HTTPS |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:8390` | Public URL used by metadata |
| `PORT` | `8390` | Web server port |

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

Adrian intentionally removes GitHub OAuth/API dependency. It is a standalone Git host designed for small self-hosted setups and homelabs while preserving the Xenon-style app experience.
