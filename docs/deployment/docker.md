# Self-host the Web app with Docker

Use this route when you want to serve Safeparts on infrastructure you control. It is separate from hosted-provider deployments such as Cloudflare Workers: Docker builds one static image and does not require provider credentials or a backend.

Safeparts still runs locally in each visitor's browser. The container serves static files only; it does not store Secrets or Recovery shares and has no telemetry.

## Build and run

Run these commands from the repository root:

```bash
docker build --pull --tag safeparts-webui --file web/Dockerfile .
docker run --detach --name safeparts-web --publish 8080:8080 safeparts-webui
```

The image starts Nginx as user ID 101. Its runtime contains the built Web app and bilingual help site, not Rust, Bun, compilers, package caches, or repository source.

Open these routes:

- Web app: <http://localhost:8080/>
- English help: <http://localhost:8080/help/>
- Arabic help: <http://localhost:8080/help/ar/>

## Check health and routes

Wait for the health check to report `healthy`:

```bash
docker inspect --format '{{.State.Health.Status}}' safeparts-web
```

Then verify the public routes and headers:

```bash
curl --fail --silent --show-error http://localhost:8080/ >/dev/null
curl --fail --silent --show-error http://localhost:8080/help/ >/dev/null
curl --fail --silent --show-error http://localhost:8080/help/ar/ >/dev/null
curl --fail --silent --show-error http://localhost:8080/healthz >/dev/null
curl --fail --silent --show-error --head http://localhost:8080/
curl --silent --output /dev/null --write-out '%{http_code}\n' \
  http://localhost:8080/help/not-a-real-page/
```

The last command should print `404`. For the same build-and-boot smoke used by CI, including SPA fallback, hashed assets, the container header policy, offline startup, and health failure behavior, run:

```bash
bash web/tests/container-smoke.sh
```

The smoke test starts the runtime with Docker networking disabled and makes its HTTP requests from inside the container. This confirms that startup and static application delivery do not need runtime access to application dependencies.

## Stop the container

```bash
docker rm --force safeparts-web
```
