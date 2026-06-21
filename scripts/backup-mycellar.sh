#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_dir="$(cd "$repo_dir/.." && pwd)"
timestamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
backup_root="${MYCELLAR_BACKUP_ROOT:-$workspace_dir/backups/cabron-cellar}"
backup_dir="$backup_root/$timestamp"
env_file="${MYCELLAR_ENV_FILE:-$repo_dir/.env.production.local}"
retention_days="${MYCELLAR_BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

git -C "$repo_dir" bundle create "$backup_dir/cabron-cellar.git.bundle" --all

tar \
  --exclude='cabron-cellar/node_modules' \
  --exclude='cabron-cellar/**/node_modules' \
  --exclude='cabron-cellar/.git' \
  --exclude='cabron-cellar/.env' \
  --exclude='cabron-cellar/.env.*' \
  --exclude='cabron-cellar/**/.env' \
  --exclude='cabron-cellar/**/.env.*' \
  --exclude='cabron-cellar/dist' \
  --exclude='cabron-cellar/**/dist' \
  --exclude='cabron-cellar/build' \
  --exclude='cabron-cellar/**/build' \
  -C "$workspace_dir" \
  -czf "$backup_dir/cabron-cellar-structure.tar.gz" \
  cabron-cellar

if [[ ! -f "$env_file" ]]; then
  echo "Env file not found: $env_file" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

if command -v pg_dump >/dev/null 2>&1; then
  if pg_dump --version | grep -qE ' 17\\.'; then
    pg_dump --format=custom --no-owner --no-privileges --file="$backup_dir/mycellar-production-db.dump" "$DATABASE_URL"
    pg_dump --schema-only --no-owner --no-privileges --file="$backup_dir/mycellar-production-schema.sql" "$DATABASE_URL"
  else
    docker run --rm -e DATABASE_URL -v "$backup_dir:/backup" postgres:17 \
      pg_dump --format=custom --no-owner --no-privileges --file=/backup/mycellar-production-db.dump "$DATABASE_URL"
    docker run --rm -e DATABASE_URL -v "$backup_dir:/backup" postgres:17 \
      pg_dump --schema-only --no-owner --no-privileges --file=/backup/mycellar-production-schema.sql "$DATABASE_URL"
  fi
else
  docker run --rm -e DATABASE_URL -v "$backup_dir:/backup" postgres:17 \
    pg_dump --format=custom --no-owner --no-privileges --file=/backup/mycellar-production-db.dump "$DATABASE_URL"
  docker run --rm -e DATABASE_URL -v "$backup_dir:/backup" postgres:17 \
    pg_dump --schema-only --no-owner --no-privileges --file=/backup/mycellar-production-schema.sql "$DATABASE_URL"
fi

find "$backup_dir" -maxdepth 1 -type f ! -name SHA256SUMS.txt -print0 | sort -z | xargs -0 sha256sum > "$backup_dir/SHA256SUMS.txt"

find "$backup_root" -mindepth 1 -maxdepth 1 -type d -mtime +"$retention_days" -print -exec rm -rf {} +

echo "Backup created: $backup_dir"
