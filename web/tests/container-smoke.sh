#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
image="${CONTAINER_SMOKE_IMAGE:-safeparts-web-container-smoke:local}"
container="safeparts-web-smoke-${RANDOM}-$$"
started=0

print_diagnostics() {
  local status=$?
  if (( status != 0 )); then
    echo "Container smoke failed; bounded diagnostics follow." >&2
    if (( started == 1 )); then
      docker logs --tail 200 "$container" >&2 || true
      docker inspect "$container" \
        --format 'state={{json .State}} health={{json .State.Health}}' >&2 || true
    fi
    docker image inspect "$image" \
      --format 'image={{.Id}} size={{.Size}} user={{.Config.User}}' >&2 || true
  fi
  if (( started == 1 )); then
    docker rm -f "$container" >/dev/null 2>&1 || true
  fi
  exit "$status"
}
trap print_diagnostics EXIT

if [[ "${CONTAINER_SMOKE_SKIP_BUILD:-0}" != "1" ]]; then
  docker build --pull --tag "$image" --file "$repo_root/web/Dockerfile" "$repo_root"
fi

docker run --detach \
  --name "$container" \
  --network none \
  --health-interval 1s \
  --health-timeout 1s \
  --health-start-period 0s \
  --health-retries 2 \
  "$image" >/dev/null
started=1

request_body() {
  docker exec "$container" wget --quiet --output-document=- "http://127.0.0.1:8080$1"
}

request_headers() {
  docker exec "$container" wget --server-response --output-document=/dev/null \
    "http://127.0.0.1:8080$1" 2>&1
}

wait_for_health() {
  local expected=$1
  local state
  for _ in $(seq 1 30); do
    state="$(docker inspect "$container" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}')"
    if [[ "$state" == "$expected" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "expected health $expected, got $state" >&2
  return 1
}

wait_for_health healthy

root_body="$(request_body /)"
grep -q '<div id="root">' <<<"$root_body"

spa_body="$(request_body /recover/from-a-bookmark)"
grep -q '<div id="root">' <<<"$spa_body"

english_help="$(request_body /help/)"
grep -q '<html lang="en"' <<<"$english_help"
grep -q 'Safeparts Help' <<<"$english_help"

arabic_help="$(request_body /help/ar/)"
grep -q '<html lang="ar" dir="rtl"' <<<"$arabic_help"
grep -q 'مساعدة Safeparts' <<<"$arabic_help"

if help_404_headers="$(request_headers /help/not-a-real-page/)"; then
  echo "expected missing help route to return an error" >&2
  exit 1
fi
grep -q '404 Not Found' <<<"$help_404_headers"

asset_path="$(grep -Eo '/assets/[^"[:space:]]+\.(js|wasm)' <<<"$root_body" | head -n 1)"
if [[ -z "$asset_path" ]]; then
  echo "root page did not reference a hashed JavaScript or WASM asset" >&2
  exit 1
fi
grep -Eq '/assets/[^/]+-[A-Za-z0-9_-]+\.(js|wasm)$' <<<"$asset_path"
request_body "$asset_path" >/dev/null

root_headers="$(request_headers /)"
grep -qi 'X-Frame-Options: SAMEORIGIN' <<<"$root_headers"
grep -qi 'X-Content-Type-Options: nosniff' <<<"$root_headers"
grep -qi 'Referrer-Policy: strict-origin-when-cross-origin' <<<"$root_headers"
grep -qi "Content-Security-Policy: default-src 'self'" <<<"$root_headers"
grep -qi 'Cache-Control: no-cache, no-store, must-revalidate' <<<"$root_headers"

asset_headers="$(request_headers "$asset_path")"
grep -qi 'Cache-Control: public, immutable' <<<"$asset_headers"

test "$(docker exec "$container" id -u)" = "101"
docker exec "$container" sh -c \
  '! command -v cargo && ! command -v rustc && ! command -v bun && test ! -e /work && test ! -e /root/.cargo'

# The health endpoint must depend on the application entry point, not merely Nginx.
docker exec --user 0 "$container" mv /usr/share/nginx/html/index.html /tmp/index.html
wait_for_health unhealthy

echo "Container smoke passed: root, SPA fallback, bilingual help, help 404, hashed asset, headers, unprivileged runtime, offline startup, and health failure behavior."
