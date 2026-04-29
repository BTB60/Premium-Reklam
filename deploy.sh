#!/usr/bin/env bash
# Premium Reklam — backend JAR yenidən qur və nohup ilə işə sal (Ubuntu/Linux).
# Layihə Gradle istifadə edir (Maven mvnw yoxdur): ./gradlew bootJar.
#
# İstifadə (repo kökündən):
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prod üçün əvvəlcə mühit dəyişənləri təyin edin və ya /etc/premiumreklam/backend.env yaradın.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo ">>> git pull origin main"
git pull origin main

BACKEND="$ROOT/backend"
LOGDIR="$BACKEND/logs"
mkdir -p "$LOGDIR"
PIDFILE="$LOGDIR/deploy.pid"
LOGFILE="$LOGDIR/app.log"

cd "$BACKEND"
chmod +x ./gradlew 2>/dev/null || true

echo ">>> Gradle bootJar (testlər atlanır)"
./gradlew bootJar --no-daemon -x test

JAR="$(ls -1 "$BACKEND/build/libs"/premium-reklam-backend-*.jar 2>/dev/null | grep -v plain | head -1 || true)"
if [[ ! -f "${JAR:-}" ]]; then
  echo "Xəta: JAR tapılmadı (backend/build/libs/premium-reklam-backend-*.jar)."
  exit 1
fi

echo ">>> Köhnə prosesi dayandırırıq"
if [[ -f "$PIDFILE" ]]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID:-}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 2
    kill -9 "$OLD_PID" 2>/dev/null || true
  fi
  rm -f "$PIDFILE"
fi
pkill -f 'premium-reklam-backend.*\.jar' 2>/dev/null || true
sleep 1

if [[ -f /etc/premiumreklam/backend.env ]]; then
  echo ">>> Env: /etc/premiumreklam/backend.env"
  set -a
  # shellcheck disable=SC1091
  source /etc/premiumreklam/backend.env
  set +a
fi

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-production}"

echo ">>> Başladılır: $JAR (PID faylı: $PIDFILE)"
nohup java -Xms256m -Xmx512m -jar "$JAR" >>"$LOGFILE" 2>&1 &
echo $! >"$PIDFILE"
echo ">>> PID $(cat "$PIDFILE"). Loqlar: $LOGFILE"
