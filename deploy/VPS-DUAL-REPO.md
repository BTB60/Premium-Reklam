# Hostinger VPS — iki repo (backend + frontend)

**Backend:** [BTB60/backandpremiumreklam](https://github.com/BTB60/backandpremiumreklam)  
**Frontend:** [BTB60/Premium-Reklam](https://github.com/BTB60/Premium-Reklam)

Eyni VPS-də bir PostgreSQL, bir Nginx (`/` → Next :3000, `/api/` → Spring :8080).

## 1. Klonlar

```bash
sudo mkdir -p /opt/premiumreklam
cd /opt/premiumreklam
sudo git clone https://github.com/BTB60/backandpremiumreklam.git backend-src
sudo git clone https://github.com/BTB60/Premium-Reklam.git frontend-src
```

`deploy/` skriptləri **frontend** klonundan götürüləcək (Premium-Reklam içində `deploy/` var). Əgər yoxdursa, `git pull` ilə `main` yenilə.

## 2. Frontend build üçün `.env.production`

`frontend-src/.env.production` məsələn:

```env
NEXT_PUBLIC_SITE_URL=https://premiumreklam.shop
NEXT_PUBLIC_API_URL=https://premiumreklam.shop
```

(Brauzer sorğuları eyni domen üzərindən `/api/...` getsin.)

## 3. İlk quraşdırma

```bash
cd /opt/premiumreklam/frontend-src
chmod +x deploy/install-vps.sh deploy/rebuild-app.sh
sudo env \
  BACKEND_SRC=/opt/premiumreklam/backend-src \
  FRONTEND_SRC=/opt/premiumreklam/frontend-src \
  bash deploy/install-vps.sh
```

## 4. HTTPS

DNS domain VPS IP-yə işarə etdikdən sonra:

```bash
sudo certbot --nginx -d premiumreklam.shop -d www.premiumreklam.shop
```

## 5. Kod yeniləməsi

```bash
cd /opt/premiumreklam/backend-src && sudo git pull
cd /opt/premiumreklam/frontend-src && sudo git pull
cd /opt/premiumreklam/frontend-src
sudo env \
  BACKEND_SRC=/opt/premiumreklam/backend-src \
  FRONTEND_SRC=/opt/premiumreklam/frontend-src \
  bash deploy/rebuild-app.sh
```

## Hostinger firewall

Inbound: **TCP 22**, **80**, **443**.

## Qeyd

İki repoda API müqaviləsi fərqlənə bilər; backend/frontend commitlərini mümkün qədər sinxron saxlayın.
