# Production Deployment Guide

## 1. FRONTEND (Vercel)

### Settings > Environment Variables:
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_URL=https://www.premiumreklam.shop
NEXT_PUBLIC_SITE_URL=https://www.premiumreklam.shop
NEXTAUTH_URL=https://www.premiumreklam.shop
```

### Deploy:
```bash
npm run build
vercel --prod
```

---

## 2. BACKEND (Render)

### Settings > Environment:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_db_password
APP_JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
SERVER_PORT=8080
DDL_AUTO=validate
LOG_LEVEL=INFO
SECURITY_LOG_LEVEL=WARN
CORS_ORIGINS=*
```

### Build Command:
```bash
./mvnw clean package -DskipTests
```

### Start Command:
```bash
java -jar target/*.jar
```

---

## 3. DATABASE (Neon PostgreSQL)

### Create new credentials:
1. Go to neon.tech > Dashboard
2. Create new role/database (don't use neondb_owner for production)
3. Update Render DATABASE_URL with new credentials

---

## 4. Local Development

### Frontend:
```bash
# Create .env.local from .env.example
cp .env.example .env.local

# Edit .env.local with:
NEXT_PUBLIC_API_URL=http://localhost:8081

# Run
npm install
npm run dev
```

### Backend:
```bash
cd backend

# Create .env or set environment variables
export DATABASE_URL=postgresql://USER:PASS@HOST/DB?sslmode=require
export APP_JWT_SECRET=your-secret-key

# Run
./mvnw spring-boot:run
# or
mvn spring-boot:run
```

---

## 5. API Endpoints (for reference)

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/users` - Get all users
- `GET /api/products` - Get all products
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}/status?status=pending` - Update order status

---

## 6. Order Status Values (lowercase)

- pending
- approved
- confirmed
- design
- production
- printing
- ready
- delivering
- completed
- cancelled
