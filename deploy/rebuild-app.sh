#!/usr/bin/env bash
# Kod yeniləndikdən təkrar build + restart (root)
#
# Tək repo: DEPLOY_SRC və ya PREMIUM_REKLAM_SRC (default: $APP_ROOT/source)
# İki repo: BACKEND_SRC + FRONTEND_SRC

set -euo pipefail
[[ "${EUID:-0}" -eq 0 ]] || { echo "sudo ilə işlədin"; exit 1; }

APP_ROOT="${APP_ROOT:-/opt/premiumreklam}"
DEPLOY_ROOT="${DEPLOY_SRC:-${PREMIUM_REKLAM_SRC:-$APP_ROOT/source}}"

if [[ -n "${BACKEND_SRC:-}" ]] && [[ -n "${FRONTEND_SRC:-}" ]]; then
  BE_SRC="$BACKEND_SRC"
  FE_SRC="$FRONTEND_SRC"
elif [[ -n "${BACKEND_SRC:-}" ]] || [[ -n "${FRONTEND_SRC:-}" ]]; then
  echo "Xəta: BACKEND_SRC və FRONTEND_SRC hər ikisi lazımdır."
  exit 1
else
  BE_SRC="$DEPLOY_ROOT"
  FE_SRC="$DEPLOY_ROOT"
fi

cd "$BE_SRC/backend"
chmod +x ./gradlew 2>/dev/null || true
sudo -u premiumreklam ./gradlew bootJar --no-daemon -q
JAR="$(ls -1 "$BE_SRC/backend/build/libs"/premium-reklam-backend-*.jar | grep -v plain | head -1)"
install -o premiumreklam -g premiumreklam -m 644 "$JAR" "$APP_ROOT/backend/premium-reklam-backend.jar"

cd "$FE_SRC"
sudo -u premiumreklam npm ci
sudo -u premiumreklam npm run build
sudo -u premiumreklam mkdir -p .next/standalone/.next
sudo -u premiumreklam cp -r .next/static .next/standalone/.next/static
sudo -u premiumreklam cp -r public .next/standalone/public
rm -rf "$APP_ROOT/web/.next"
sudo -u premiumreklam mkdir -p "$APP_ROOT/web"
sudo -u premiumreklam cp -a .next "$APP_ROOT/web/"

systemctl restart premiumreklam-backend premiumreklam-frontend
echo "OK"
