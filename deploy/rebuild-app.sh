#!/usr/bin/env bash
# Kod yeniləndikdən təkrar build + restart (root)
# PREMIUM_REKLAM_SRC=/opt/premiumreklam/source ilə işlədin

set -euo pipefail
[[ "${EUID:-0}" -eq 0 ]] || { echo "sudo ilə işlədin"; exit 1; }

APP_ROOT="${APP_ROOT:-/opt/premiumreklam}"
SRC="${PREMIUM_REKLAM_SRC:-$APP_ROOT/source}"

cd "$SRC/backend"
chmod +x ./gradlew 2>/dev/null || true
sudo -u premiumreklam ./gradlew bootJar --no-daemon -q
JAR="$(ls -1 "$SRC/backend/build/libs"/premium-reklam-backend-*.jar | grep -v plain | head -1)"
install -o premiumreklam -g premiumreklam -m 644 "$JAR" "$APP_ROOT/backend/premium-reklam-backend.jar"

cd "$SRC"
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
