# Premium Reklam

Reklam və dekor layihəsi: **Next.js** frontend + **Spring Boot** backend.

## Hostinger VPS-də ilk quruluş (Ubuntu)

Bu layihədə backend **Gradle** ilə qurulur (`backend/gradlew`). Maven `mvnw` yoxdur.

### 1. Asılılıqlar

Serverdə: **Git**, **OpenJDK 17**, **PostgreSQL**, istəyə bağlı **Node.js** (frontend üçün).

### 2. Kodu yüklə

```bash
sudo mkdir -p /opt/premiumreklam
sudo chown "$USER":"$USER" /opt/premiumreklam
cd /opt/premiumreklam
git clone https://github.com/BTB60/Premium-Reklam.git app
cd app
```

### 3. PostgreSQL + backend mühiti

Production profili **`application.yml`** içində `SPRING_DATASOURCE_*` dəyişənləri ilə işləyir. Ən rahat yolu əlavə etmək:

```bash
sudo mkdir -p /etc/premiumreklam
sudo nano /etc/premiumreklam/backend.env
```

Nümunə məzmun (`deploy/backend.env.example` ilə uyğun):

```env
SPRING_PROFILES_ACTIVE=production
PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/premium_reklam
SPRING_DATASOURCE_USERNAME=premium_user
SPRING_DATASOURCE_PASSWORD=GÜCLÜ_PAROL
JWT_SECRET=UZUN_Təsadüfi_STRING
JWT_EXPIRATION=86400000
LOG_LEVEL=INFO
DDL_AUTO=update
SERVER_FORWARD_HEADERS_STRATEGY=framework
```

Fayl icazələri məhdud saxlanılmalıdır (`chmod 640` və s.).

### 4. Tam VPS paketi (nginx + systemd + ilk build)

Layihədə hazır skript var:

```bash
chmod +x deploy/install-vps.sh
sudo bash deploy/install-vps.sh
```

SSH üçün Hostinger firewall-da **22 / 80 / 443** portları açıq olmalıdır.

### 5. Yalnız backend yeniləməsi — `deploy.sh`

**Vacib:** `deploy/install-vps.sh` artıq **systemd** xidməti (`premiumreklam-backend`) qurursa, **`deploy.sh`** ilə eyni anda iki backend işləməsin — ya systemd-i dayandır (`sudo systemctl stop premiumreklam-backend`), ya da təkrar deploy üçün **`deploy/rebuild-app.sh`** istifadə et.

Repo kökündən:

```bash
chmod +x deploy.sh
./deploy.sh
```

Bu skript:

1. `git pull origin main` edir  
2. `backend`-də `./gradlew bootJar -x test` ilə JAR qurur  
3. Köhnə **premium-reklam-backend** JAR prosesini dayandırır (`logs/deploy.pid` + uyğun `pkill`)  
4. Yeni JAR-ı **`nohup`** ilə arxa fonda işə salır; çıxış **`backend/logs/app.log`** faylına yazılır  

Əvvəlcədən `/etc/premiumreklam/backend.env` varsa, skript onu **source** edir.

---

## Əlavə qeydlər

- Frontend üçün tam prod quruluş: `deploy/README-AZ.txt` və `deploy/rebuild-app.sh`.  
- Yerli inkişaf üçün backend default **`local`** profilində H2 istifadə edir; prod üçün **`SPRING_PROFILES_ACTIVE=production`** mütləqdir.
