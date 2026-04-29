Premium Reklam — VPS (Ubuntu) yerləşdirmə qısa təlimat
========================================================

Mən (agent) sizin serverə SSH ilə qoşula bilmərəm — repoda hazır skriptlər və konfiqlər var.

1) DNS
   - premiumreklam.shop və www üçün A qeydi → VPS-in public IP ünvanı.

2) Kod serverə
   - mkdir -p /opt/premiumreklam && git clone <repo> /opt/premiumreklam/source
   - SSH root parolunu çatda paylaşmayın.

3) Bir dəfəlik quraşdırma
   - cd /opt/premiumreklam/source
   - chmod +x deploy/install-vps.sh
   - sudo bash deploy/install-vps.sh

   İlk işləmədə /etc/premiumreklam/backend.env yaradılır (DB + JWT). Faylı təhlükəsiz saxlayın.

4) HTTPS (DNS işlədikdən sonra)
   - sudo certbot --nginx -d premiumreklam.shop -d www.premiumreklam.shop

5) Kod yeniləmə (deploy/rebuild-app.sh)
   - cd /opt/premiumreklam/source && git pull
   - sudo bash deploy/rebuild-app.sh

Fayllar
-------
deploy/nginx/premiumreklam.shop.conf    — Nginx (install skripti avtomatik qoyur)
deploy/systemd/*.service                — systemd unitlər
deploy/backend.env.example              — əl ilə env üçün nümunə
deploy/frontend.env.example

Frontend build .env.production oxuyur — NEXT_PUBLIC_SITE_URL və NEXT_PUBLIC_API_URL domenə uyğun olmalıdır.

İki repo (backandpremiumreklam + Premium-Reklam) eyni VPS
-----------------------------------------------------------
Tam təlimat: deploy/VPS-DUAL-REPO.md

   install:
   sudo env BACKEND_SRC=/opt/premiumreklam/backend-src \
            FRONTEND_SRC=/opt/premiumreklam/frontend-src \
            bash /opt/premiumreklam/frontend-src/deploy/install-vps.sh

   yeniləmə:
   sudo env BACKEND_SRC=... FRONTEND_SRC=... bash .../deploy/rebuild-app.sh
