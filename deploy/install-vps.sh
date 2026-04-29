#!/usr/bin/env bash
# Premium Reklam — Ubuntu VPS quraşdırması (root ilə işə salın)
# İstifadə: sudo bash deploy/install-vps.sh
# Əvvəl: kod /opt/premiumreklam/source-da olmalıdır (və ya PREMIUM_REKLAM_SRC dəyişənində).

set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Root tələb olunur: sudo bash deploy/install-vps.sh"
  exit 1
fi

APP_ROOT="${APP_ROOT:-/opt/premiumreklam}"
SRC="${PREMIUM_REKLAM_SRC:-$APP_ROOT/source}"
DOMAIN="${DEPLOY_DOMAIN:-premiumreklam.shop}"

echo "=== Premium Reklam VPS ==="
echo "APP_ROOT=$APP_ROOT"
echo "SRC=$SRC"
echo "DOMAIN=$DOMAIN"

if [[ ! -f "$SRC/package.json" ]] || [[ ! -f "$SRC/backend/build.gradle" ]]; then
  echo "Xəta: layihə kökü tapılmadı: $SRC"
  echo "Git clone edin, məsələn:"
  echo "  mkdir -p $APP_ROOT && git clone <repo-url> $SRC"
  exit 1
fi

groupadd -f premiumreklam
if ! id premiumreklam &>/dev/null; then
  useradd -r -g premiumreklam -d "$APP_ROOT" -s /usr/sbin/nologin premiumreklam
fi

mkdir -p "$APP_ROOT/backend" "$APP_ROOT/web" /etc/premiumreklam /var/www/html
chown -R premiumreklam:premiumreklam "$APP_ROOT"
chown -R premiumreklam:premiumreklam "$SRC"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  openjdk-17-jdk \
  nginx \
  curl \
  ca-certificates \
  postgresql \
  postgresql-contrib \
  certbot \
  python3-certbot-nginx

NEED_NODE=1
if command -v node &>/dev/null; then
  MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
  [[ "${MAJOR:-0}" -ge 18 ]] && NEED_NODE=0
fi
if [[ "$NEED_NODE" -eq 1 ]]; then
  echo "=== Node.js 20 LTS (NodeSource) ==="
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "=== PostgreSQL istifadəçi və DB ==="
if [[ ! -f /etc/premiumreklam/backend.env ]]; then
  DB_PASS="${DEPLOY_DB_PASSWORD:-$(openssl rand -hex 24)}"
  JWT_SECRET="${DEPLOY_JWT_SECRET:-$(openssl rand -base64 48)}"

  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER premium_user WITH PASSWORD '${DB_PASS}';" 2>/dev/null \
    || sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER premium_user WITH PASSWORD '${DB_PASS}';"

  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='premium_reklam'" | grep -q 1; then
    sudo -u postgres createdb -O premium_user premium_reklam
  fi

  echo "=== /etc/premiumreklam/backend.env yaradılır ==="
  install -o root -g premiumreklam -m 640 /dev/stdin /etc/premiumreklam/backend.env <<ENVFILE
SPRING_PROFILES_ACTIVE=production
PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/premium_reklam
SPRING_DATASOURCE_USERNAME=premium_user
SPRING_DATASOURCE_PASSWORD=$DB_PASS
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=86400000
LOG_LEVEL=INFO
DDL_AUTO=update
SERVER_FORWARD_HEADERS_STRATEGY=framework
ENVFILE
  echo ""
  echo ">>> DB və JWT /etc/premiumreklam/backend.env — təhlükəsiz saxlayın."
else
  echo ">>> /etc/premiumreklam/backend.env mövcuddur — PostgreSQL parolu və JWT toxunulmur."
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='premium_reklam'" | grep -q 1; then
    echo ">>> Xəbərdarlıq: premium_reklam DB yoxdur — əl ilə yaradın və ya müvəqqəti backend.env silib skripti yenidən işə salın."
  fi
fi

if [[ ! -f /etc/premiumreklam/frontend.env ]]; then
  install -o root -g premiumreklam -m 640 /dev/stdin /etc/premiumreklam/frontend.env <<'FRONTENV'
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=3000
FRONTENV
fi

echo "=== Backend build (Gradle) ==="
cd "$SRC/backend"
chmod +x ./gradlew 2>/dev/null || true
sudo -u premiumreklam ./gradlew bootJar --no-daemon -q

JAR="$(ls -1 "$SRC/backend/build/libs"/premium-reklam-backend-*.jar | grep -v plain | head -1)"
if [[ ! -f "$JAR" ]]; then
  echo "JAR tapılmadı."
  exit 1
fi
install -o premiumreklam -g premiumreklam -m 644 "$JAR" "$APP_ROOT/backend/premium-reklam-backend.jar"

echo "=== Frontend build (Next standalone) ==="
cd "$SRC"
sudo -u premiumreklam npm ci
sudo -u premiumreklam npm run build
sudo -u premiumreklam mkdir -p .next/standalone/.next
sudo -u premiumreklam cp -r .next/static .next/standalone/.next/static
sudo -u premiumreklam cp -r public .next/standalone/public

rm -rf "$APP_ROOT/web/.next"
sudo -u premiumreklam mkdir -p "$APP_ROOT/web"
sudo -u premiumreklam cp -a .next "$APP_ROOT/web/"

echo "=== systemd ==="
install -m 644 "$SRC/deploy/systemd/premiumreklam-backend.service" /etc/systemd/system/
install -m 644 "$SRC/deploy/systemd/premiumreklam-frontend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable premiumreklam-backend premiumreklam-frontend
systemctl restart premiumreklam-backend
sleep 3
systemctl restart premiumreklam-frontend

echo "=== Nginx ==="
install -m 644 "$SRC/deploy/nginx/premiumreklam.shop.conf" /etc/nginx/sites-available/premiumreklam.shop
ln -sf /etc/nginx/sites-available/premiumreklam.shop /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl reload nginx

echo ""
echo "=== Hazır ==="
echo "• Backend:  systemctl status premiumreklam-backend"
echo "• Frontend: systemctl status premiumreklam-frontend"
echo "• DNS $DOMAIN -> bu serverin public IP olmalıdır."
echo "• SSL:      certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "• Əgər backend.env ilk dəfə yaradıldısa, DB parolu yuxarıda faylda — backup saxlayın."
echo ""
