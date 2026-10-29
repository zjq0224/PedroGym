#!/usr/bin/env bash
# Build both Docker images from this checkout, recreate the local stack and verify that the
# running containers carry the current Git revision. By default a dirty tree is refused so the
# deployed image always corresponds to an exact commit. Use --allow-dirty only for development.

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
allow_dirty=0

if [[ "${1:-}" == "--allow-dirty" ]]; then
  allow_dirty=1
  shift
fi

if [[ "$#" -ne 0 ]]; then
  echo "usage: $0 [--allow-dirty]" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or is not on PATH" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running" >&2
  exit 1
fi

if [[ "$allow_dirty" -eq 0 ]]; then
  dirty="$(git -C "$repo_root" status --porcelain --untracked-files=normal)"
  if [[ -n "$dirty" ]]; then
    echo "Refusing to deploy a dirty working tree; commit or stash these files first:" >&2
    printf '%s\n' "$dirty" >&2
    echo "For an intentional development build, run: $0 --allow-dirty" >&2
    exit 1
  fi
fi

git_sha="$(git -C "$repo_root" rev-parse --short=12 HEAD)"
build_time="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
export LOCAL_GIT_SHA="$git_sha"
export LOCAL_BUILD_VERSION="local-$git_sha"
export LOCAL_BUILD_DATE="$build_time"

compose=(
  docker compose
  --project-directory "$repo_root"
  -f "$repo_root/docker-compose.yml"
  -f "$repo_root/compose.local.yml"
)

# This is an immediate rollback snapshot, not an off-machine backup. The directory is ignored by
# Git and created with owner-only permissions because it contains passkeys and session secrets.
if [[ -d "$repo_root/data" ]]; then
  backup_dir="$repo_root/.local-backups"
  timestamp="$(date +'%Y%m%d-%H%M%S')"
  backup_file="$backup_dir/opengym-$timestamp-$git_sha.tar.gz"
  umask 077
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  tar -C "$repo_root" -czf "$backup_file" data
  chmod 600 "$backup_file"
  echo "Created pre-deploy snapshot: $backup_file"
fi

echo "Building local images from Git $git_sha ..."
"${compose[@]}" build

echo "Starting the locally built stack ..."
"${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 180

for service in api web; do
  container_id="$("${compose[@]}" ps -q "$service")"
  if [[ -z "$container_id" ]]; then
    echo "No running container found for $service" >&2
    exit 1
  fi

  image_revision="$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$container_id")"
  if [[ "$image_revision" != "$git_sha" ]]; then
    echo "$service is running revision '$image_revision', expected '$git_sha'" >&2
    exit 1
  fi
done

health="$("${compose[@]}" exec -T web sh -c 'wget -qO- "http://127.0.0.1:${NGINX_PORT:-80}/api/health"')"
echo "Health check: $health"
echo "Local deployment is running Git $git_sha"
