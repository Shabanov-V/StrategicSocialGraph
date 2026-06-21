# Deployment

The app ships as a **single Docker container** that runs both tiers:

- **nginx** (port 80) serves the built React client from `/usr/share/nginx/html` and reverse-proxies `/api/*` to the Node server.
- **Node/Express server** (port 3001) handles auth and graph sync, talking to a PostgreSQL database.

`entrypoint.sh` starts nginx and the Node process together; `nginx.conf` defines the static-file + `/api` proxy rules. Because nginx serves the client and proxies the API on the same origin, `CLIENT_ORIGIN` is left empty in production.

The container attaches to an **external Docker network** (`web_gateway`) and sits behind a separate reverse proxy — it does **not** publish a host port itself.

```
            ┌─────────────────────── social_graph container ───────────────────────┐
  internet  │  nginx :80  ──/──▶  built client (dist)                               │
  ──▶ proxy │             ──/api──▶  Node server :3001  ──▶  PostgreSQL (external)  │
            └──────────────────────────────────────────────────────────────────────┘
                         (joined to the external `web_gateway` network)
```

## Prerequisites

On the deploy host you need:

- Docker with the Compose plugin (`docker compose`).
- The external network: `docker network create web_gateway` (only if it doesn't already exist — `docker network ls`).
- A reachable PostgreSQL instance (the `postgres` host referenced by `DATABASE_URL` in `docker-compose.yml`). Schema is created automatically on first boot by `initDb()` — no migration step.
- A reverse proxy on `web_gateway` that routes your public hostname to the container's port 80.
- A `.env` file in the repo root (see below). It is git-ignored and never baked into the image except for the build arg noted below.

## Environment variables

Create `.env` in the repo root. Compose reads it automatically.

| Variable | Where it's used | Notes |
|---|---|---|
| `GOOGLE_CLIENT_ID` | build arg → client, and server runtime | Google OAuth client id. Passed to the client build as `VITE_GOOGLE_CLIENT_ID`, so **a rebuild is required if it changes**. |
| `JWT_SECRET` | server runtime | Signs session cookies. **Required in production** — the server throws on boot if unset when `NODE_ENV=production`. |

Other runtime values are set directly in `docker-compose.yml`: `DATABASE_URL`, `NODE_ENV=production`, `PORT=3001`, and `CLIENT_ORIGIN` (empty for same-origin).

```bash
# .env
GOOGLE_CLIENT_ID=your-google-oauth-client-id
JWT_SECRET=a-long-random-secret
```

## Deploy

From the repo root on the host, build the image and (re)start the container:

```bash
docker compose up -d --build
```

This rebuilds the client and server from the **current working tree** (whatever branch/commit is checked out), then recreates the `social_graph` container in place. Expect a brief interruption while the container restarts.

## Verify

The container ships without `curl`/`wget`; use `node` inside it, or check from your reverse proxy.

```bash
# container is running
docker ps --filter name=social_graph

# server is up
docker logs social_graph --tail 20          # expect: "Server listening on port 3001"
docker exec social_graph node -e "fetch('http://localhost:3001/api/health').then(r=>r.json()).then(j=>console.log(j))"
# → { status: 'ok' }

# nginx is serving the built client
docker exec social_graph node -e "fetch('http://localhost:80/').then(r=>console.log(r.status, r.headers.get('content-type')))"
# → 200 text/html
```

## Operate

```bash
docker logs -f social_graph        # follow logs
docker compose restart             # restart without rebuilding
docker compose down                # stop and remove the container
```

The container is configured with `restart: always`, so it comes back after host reboots or crashes.

## Rollback

The build produces an untagged local image, so roll back by checking out the previous commit and rebuilding:

```bash
git checkout <previous-commit>
docker compose up -d --build
```

To avoid rebuilds on rollback, tag images per release (e.g. `docker tag socialgraph-social-graph socialgraph:<version>`) before deploying and re-run with the desired tag.

## Notes

- The build runs `npm install` (not `npm ci`) and `npm run build` for the client (`vite build`) and `tsc` for the server, in separate stages of the multi-stage `Dockerfile`.
- The Graph Document module is plain TypeScript compiled by Vite during the client build — no extra deploy step.
