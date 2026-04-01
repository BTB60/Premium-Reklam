# Pre-Deploy Checklist for Vercel Deployment

## Configuration Files Fixed ✅

### vercel.json
- [x] Removed invalid properties (`version`, `regions`)
- [x] Removed env block (use Vercel Dashboard instead)
- [x] Kept only security headers

### API Routes (Direct DB Access Removed) ✅
- [x] Deleted `src/app/api/orders/route.ts` (direct SQL access)
- [x] Deleted `src/app/api/admin/payment/route.ts` (direct SQL access)
- [x] Deleted `src/app/api/_lib/db.ts` (disabled SQL client)
- [x] Deleted `src/app/api/db.ts` (in-memory DB)

### API Client (authApi.ts) ✅
- [x] Removed `fetchLocalApi` function
- [x] Renamed `getOrdersFromNeon` to `getOrdersFromBackend`
- [x] All API calls now use `fetchApi` which calls Render backend directly

### Environment Variables ✅
- [x] Created `.env.production` template
- [x] NEXT_PUBLIC_API_URL configured for Render backend

---

## Required Vercel Configuration

### 1. Environment Variables (Vercel Dashboard)
Go to: **Vercel Dashboard > Settings > Environment Variables**

Add these variables:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://premium-reklam-backend.onrender.com` | Production |
| `NEXT_PUBLIC_URL` | `https://www.premiumreklam.shop` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://www.premiumreklam.shop` | Production |
| `NEXTAUTH_URL` | `https://www.premiumreklam.shop` | Production |

For development, use `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_URL=http://localhost:3000
```

### 2. Deploy Steps

```bash
# 1. Push changes to GitHub
git add .
git commit -m "fix: Remove direct DB access, use backend API only"
git push

# 2. Vercel will automatically deploy from GitHub
# Or manually trigger:
vercel --prod
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                           │
│                     premiumreklam.shop                          │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Code                                                  │
│  ├── Only calls Backend API                                     │
│  ├── No direct database access                                 │
│  ├── Uses authApi.ts, orderApi.ts, productApi.ts               │
│  └── Environment: NEXT_PUBLIC_API_URL                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RENDER (Backend)                            │
│                     premium-reklam-backend.onrender.com         │
├─────────────────────────────────────────────────────────────────┤
│  Spring Boot API                                                │
│  ├── Auth: /api/auth/login, /api/auth/register                 │
│  ├── Orders: /api/orders, /api/orders/{id}                    │
│  ├── Products: /api/products                                  │
│  └── Users: /api/users                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEON (Database)                             │
│                     postgresql://...                            │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL                                                     │
│  ├── users                                                     │
│  ├── orders                                                    │
│  ├── products                                                  │
│  └── payments                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Modified

1. **vercel.json** - Minimal config with security headers
2. **src/lib/authApi.ts** - Removed fetchLocalApi, use fetchApi only
3. **src/app/admin/dashboard/page.tsx** - Updated function name
4. **src/app/admin/page.tsx** - Updated function name
5. **src/app/dashboard/page.tsx** - Updated function name
6. **src/components/admin/PaymentManagement.tsx** - Updated function name
7. **.env.production** - Created production env template

## Files Deleted

1. `src/app/api/orders/route.ts` - Direct DB access
2. `src/app/api/admin/payment/route.ts` - Direct DB access
3. `src/app/api/_lib/db.ts` - SQL client (disabled)
4. `src/app/api/db.ts` - In-memory DB

## Files Kept (Disabled)

These files are kept for reference but throw errors if accidentally imported:
- `src/lib/neonDb.ts`
- `src/lib/netlifyDb.ts`
- `src/lib/db-hybrid.ts`
- `src/lib/neon.ts`
- `src/lib/mysql.ts`

---

## Troubleshooting

### If Build Fails
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### If API Calls Fail
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
3. Check Render backend is running: https://premium-reklam-backend.onrender.com/api

### If CORS Errors
Ensure Render backend has CORS configured for:
- `https://www.premiumreklam.shop`
- `https://premiumreklam.shop`

---

## Verification Commands

```bash
# Test build locally
npm run build

# Test locally with production API
NEXT_PUBLIC_API_URL=https://premium-reklam-backend.onrender.com npm run dev
```
