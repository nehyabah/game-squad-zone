# Railway Deployment Guide for SquadPot Backend

## Current CORS Issue Fix

The CORS error you're experiencing is because Railway needs to have the correct environment variable set.

### Docker Image
- **Image**: `naeabah/squadpot-backend:latest`
- **Digest**: `sha256:43ae045704f308d1fd484936da41c8e1bbc989205ec0c433c005b60011d98cdf`

### Required Environment Variables for Railway

Set these in your Railway project settings:

```bash
# CRITICAL: Must be set to 'production' to enable proper CORS
NODE_ENV=production

# Database
DATABASE_URL=<your-railway-postgres-url>

# Port (Railway sets this automatically, but you can override)
PORT=8080

# Auth0/Okta
OKTA_DOMAIN=squadpot.eu.auth0.com
OKTA_CLIENT_ID=JCCclRaBKBm1Qr5jYZL7sPdqStRcXyQm
OKTA_CLIENT_SECRET=cP8TAoCyTdsvU1YTGutQwgA0TceNsmRihxojtl_stL1w254CNCUEE_UsaZ7t3S0v
OKTA_AUDIENCE=api://default
OKTA_ISSUER=https://squadpot.eu.auth0.com
OKTA_REDIRECT_URI=https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net/auth/callback

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_51JqhZtDmKmQ51eGsHsXbTdxgZYNdXrzQGfBTKXctaIdQzcZZkn36cunna1ynUXV6KUi2PfuH66Y8oDxcBLHqmDXZ00kDCt4RZI
STRIPE_WEBHOOK_SECRET=pk_test_51JqhZtDmKmQ51eGsHgf4ogyKz14xUoHgEM3CmbP6COGtYUaf6LYNwbRjBCSUcrtb8hoD0kzonBtDC9MduSImYefo00htbpvYgE

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=BNvjAmkGaRPvt8ptUdvqQ_h9XvWZFy26aWRkiepP4FOwBi0XXlQrhuMHRVo_eZeIrdbEg4cl7xbDkz_VvTd13tQ
VAPID_PRIVATE_KEY=CWlEDPLM9OldNScmNVNh7Q61_FfW_mVRRMzZBMBuBsA
VAPID_SUBJECT=mailto:nabah@miagen.com

# Odds API
VITE_ODDS_API_KEY=5aa0a3d280740ab65185d78b950d7c02
```

## Deployment Steps

### 1. From Railway Dashboard:

1. Go to your Railway project
2. Click on your backend service
3. Go to **Settings** → **Environment Variables**
4. Make sure `NODE_ENV=production` is set
5. Go to **Settings** → **Deploy**
6. Under "Deployment Method", select **Docker Image**
7. Enter: `naeabah/squadpot-backend:latest`
8. Click **Deploy**

### 2. Using Railway CLI:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set NODE_ENV=production

# Deploy from Docker Hub
railway up --service backend --image naeabah/squadpot-backend:latest
```

## CORS Configuration

The backend now includes these allowed origins:
- `https://www.squadpot.dev`
- `https://squadpot.dev`
- `https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net` ✅
- `https://sqpbackend.vercel.app`
- `https://game-squad-zone-94o5.vercel.app`
- `https://game-squad-zone.vercel.app`
- `http://localhost:5173`
- `http://localhost:3000`
- `http://localhost:8080`

### Why the CORS Error Happened

When `credentials: true` is set on the frontend request, browsers require:
1. **Specific origin** in `Access-Control-Allow-Origin` (NOT wildcard `*`)
2. `Access-Control-Allow-Credentials: true` header

The backend code now:
- ✅ Returns the **exact origin** from the allowedOrigins list
- ✅ Never uses wildcard `*` when credentials mode is active
- ✅ Logs all CORS checks for debugging

## Verify Deployment

After deploying, check the logs:

```bash
railway logs
```

You should see:
```
SQUADPOT BACKEND VERSION: 3.2 - WITH PUSH NOTIFICATIONS
CORS check - Origin: https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net, isProd: true
CORS: Allowed origin matched - https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net
```

## Test the Fix

1. Open your frontend: `https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net`
2. Try to login
3. Check browser console - CORS error should be gone
4. Check Railway logs to see CORS debug output

## Troubleshooting

### If CORS error persists:

1. **Check Railway logs** for CORS debug output
2. **Verify NODE_ENV** is set to `production`
3. **Check frontend origin** matches exactly (case-sensitive, no trailing slash)
4. **Clear browser cache** and try again
5. **Check Railway deployment** is using the latest image

### Check current deployment:

```bash
# Railway CLI
railway status

# Check environment
railway variables
```

## Quick Redeploy

To force a new deployment with the latest image:

```bash
# Tag and push new version
docker tag squadpot-backend:latest naeabah/squadpot-backend:latest
docker push naeabah/squadpot-backend:latest

# Redeploy on Railway
railway up --service backend
```

## Health Check

Once deployed, verify:

```bash
curl https://squadpot-backend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "userCount": <number>,
  "timestamp": "2025-10-02T..."
}
```
