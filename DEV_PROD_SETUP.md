# Dev & Prod Environments Setup

## Overview

You have two main options for dev/prod setup:

| Option | Cost | Complexity | Best For |
|--------|------|------------|----------|
| **Option 1: Deployment Slots** | 1x Standard tier ($55/mo) | Low | Same codebase, different configs |
| **Option 2: Separate Resources** | 2x Basic tier ($26/mo) | Medium | Complete isolation |

**Recommendation: Option 1 (Deployment Slots)** - Built-in feature, easy to use, professional setup.

---

## Option 1: Deployment Slots (Recommended)

**What are deployment slots?**
Think of them as parallel versions of your app running on the same server:
- **Production slot**: `https://game-squad-backend.azurewebsites.net`
- **Staging slot**: `https://game-squad-backend-staging.azurewebsites.net`

**Benefits:**
- ✅ Test in production-like environment
- ✅ Zero-downtime deployments (swap slots)
- ✅ Easy rollback (swap back)
- ✅ Same infrastructure, different configs
- ✅ No additional resources needed

**Cost:** Requires Standard tier ($55/month) or higher

### Step 1: Upgrade App Service Plan

**Via Azure Portal:**
1. Go to https://portal.azure.com
2. Navigate to `game-squad-plan` (your App Service Plan)
3. Click **Scale up (App Service plan)** in left menu
4. Select **S1 Standard** tier
5. Click **Apply**

**Via Azure Cloud Shell:**
```bash
az appservice plan update \
  --name game-squad-plan \
  --resource-group game-squad-zone-rg \
  --sku S1
```

### Step 2: Create Staging Slot

**Via Azure Portal:**
1. Go to your Web App: `game-squad-backend`
2. Click **Deployment slots** in left menu
3. Click **+ Add Slot**
4. Name: `staging`
5. Clone settings from: `game-squad-backend`
6. Click **Add**

**Via Azure Cloud Shell:**
```bash
az webapp deployment slot create \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --slot staging \
  --configuration-source game-squad-backend
```

### Step 3: Configure Environment Variables

**Staging-specific variables:**
1. Go to Web App → **Deployment slots** → **staging**
2. Click **Configuration**
3. Update these variables for staging:
   ```
   NODE_ENV = staging
   FRONTEND_URL = https://staging.yourdomain.com
   DATABASE_URL = your-staging-database-url (if separate)
   ```
4. Check **Deployment slot setting** for variables that should NOT swap
5. Click **Save**

**Slot-specific vs Swappable:**
- ✅ **Slot setting** (checked): Stays with the slot (DATABASE_URL, API keys)
- ❌ **Swappable** (unchecked): Moves when you swap slots (NODE_ENV usually)

### Step 4: Update GitHub Actions

Create `.github/workflows/deploy-azure-environments.yml`:

```yaml
name: Deploy to Azure Environments

on:
  push:
    branches:
      - main        # Deploy to production
      - develop     # Deploy to staging
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - production
          - staging

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    # Determine environment based on branch or manual input
    environment:
      name: ${{ github.event_name == 'workflow_dispatch' && inputs.environment || (github.ref == 'refs/heads/main' && 'production' || 'staging') }}
      url: ${{ steps.deploy.outputs.webapp-url }}

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to ACR
      uses: docker/login-action@v3
      with:
        registry: ${{ secrets.ACR_NAME }}.azurecr.io
        username: ${{ secrets.ACR_USERNAME }}
        password: ${{ secrets.ACR_PASSWORD }}

    # Set environment-specific variables
    - name: Set environment variables
      id: vars
      run: |
        if [[ "${{ github.ref }}" == "refs/heads/main" ]] || [[ "${{ inputs.environment }}" == "production" ]]; then
          echo "SLOT=" >> $GITHUB_OUTPUT
          echo "TAG=prod-${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "ENV_NAME=production" >> $GITHUB_OUTPUT
        else
          echo "SLOT=staging" >> $GITHUB_OUTPUT
          echo "TAG=staging-${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "ENV_NAME=staging" >> $GITHUB_OUTPUT
        fi

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: |
          ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:${{ steps.vars.outputs.TAG }}
          ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:latest-${{ steps.vars.outputs.ENV_NAME }}

    - name: Deploy to Azure Web App
      id: deploy
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
        slot-name: ${{ steps.vars.outputs.SLOT }}
        images: ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:${{ steps.vars.outputs.TAG }}

    - name: Logout from Azure
      run: az logout
```

### Step 5: Branch Strategy

**Two branches:**
- `main` → Production (auto-deploy)
- `develop` → Staging (auto-deploy)

**Workflow:**
```bash
# Work on features
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "Add feature"

# Deploy to staging for testing
git checkout develop
git merge feature/my-feature
git push origin develop
# → Auto-deploys to staging slot

# Test staging: https://game-squad-backend-staging.azurewebsites.net

# Deploy to production
git checkout main
git merge develop
git push origin main
# → Auto-deploys to production
```

### Step 6: Swap Slots (Zero-Downtime Deploy)

**When staging looks good, swap to production:**

**Via Azure Portal:**
1. Go to Web App → **Deployment slots**
2. Click **Swap** at the top
3. Source: `staging`
4. Target: `production`
5. Review changes
6. Click **Swap**
7. Takes ~30 seconds, zero downtime!

**Via Azure Cloud Shell:**
```bash
az webapp deployment slot swap \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --slot staging \
  --target-slot production
```

### URLs

- **Production**: `https://game-squad-backend.azurewebsites.net`
- **Staging**: `https://game-squad-backend-staging.azurewebsites.net`

---

## Option 2: Separate Resources (More Control)

**Setup:**
- Completely separate App Services
- Separate databases
- True isolation between environments

**Cost:** 2x infrastructure costs
- Dev: Basic B1 ($13/mo)
- Prod: Standard S1 ($55/mo)
- Total: $68/mo + databases

### Step 1: Create Dev Resources

**Via Azure Cloud Shell:**
```bash
# Create separate App Service Plan for dev (cheaper tier)
az appservice plan create \
  --name game-squad-dev-plan \
  --resource-group game-squad-zone-rg \
  --is-linux \
  --sku B1

# Create dev Web App
az webapp create \
  --resource-group game-squad-zone-rg \
  --plan game-squad-dev-plan \
  --name game-squad-backend-dev \
  --deployment-container-image-name gamesquadzone.azurecr.io/game-squad-backend:latest

# Configure container settings (same as prod)
ACR_USERNAME=$(az acr credential show --name gamesquadzone --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name gamesquadzone --query passwords[0].value --output tsv)

az webapp config container set \
  --name game-squad-backend-dev \
  --resource-group game-squad-zone-rg \
  --docker-registry-server-url https://gamesquadzone.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# Set environment variables for dev
az webapp config appsettings set \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend-dev \
  --settings \
    NODE_ENV="development" \
    DATABASE_URL="your-dev-database-url" \
    FRONTEND_URL="https://dev.yourdomain.com" \
    # ... other variables
```

### Step 2: GitHub Actions for Separate Resources

Update `.github/workflows/deploy-azure-environments.yml`:

```yaml
name: Deploy to Azure Environments

on:
  push:
    branches: [ main, develop ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        type: choice
        options: [ production, development ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set environment
      id: env
      run: |
        if [[ "${{ github.ref }}" == "refs/heads/main" ]] || [[ "${{ inputs.environment }}" == "production" ]]; then
          echo "APP_NAME=game-squad-backend" >> $GITHUB_OUTPUT
          echo "TAG=prod-${{ github.sha }}" >> $GITHUB_OUTPUT
        else
          echo "APP_NAME=game-squad-backend-dev" >> $GITHUB_OUTPUT
          echo "TAG=dev-${{ github.sha }}" >> $GITHUB_OUTPUT
        fi

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to ACR
      uses: docker/login-action@v3
      with:
        registry: ${{ secrets.ACR_NAME }}.azurecr.io
        username: ${{ secrets.ACR_USERNAME }}
        password: ${{ secrets.ACR_PASSWORD }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: |
          ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:${{ steps.env.outputs.TAG }}

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ steps.env.outputs.APP_NAME }}
        images: ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:${{ steps.env.outputs.TAG }}

    - name: Logout
      run: az logout
```

### URLs

- **Production**: `https://game-squad-backend.azurewebsites.net`
- **Development**: `https://game-squad-backend-dev.azurewebsites.net`

---

## Database Strategy

You need to decide: shared database or separate databases?

### Option A: Separate Databases (Recommended)

**Pros:**
- ✅ True isolation
- ✅ Can test destructive operations
- ✅ Production data stays safe

**Setup:**

**Keep Railway for both:**
- Create two Railway projects: `game-squad-prod` and `game-squad-dev`
- Or create two databases in same project

**Or use Azure PostgreSQL:**
```bash
# Production database
az postgres flexible-server create \
  --resource-group game-squad-zone-rg \
  --name game-squad-db-prod \
  --location eastus \
  --admin-user adminuser \
  --admin-password 'SecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable

# Development database (cheaper tier)
az postgres flexible-server create \
  --resource-group game-squad-zone-rg \
  --name game-squad-db-dev \
  --location eastus \
  --admin-user adminuser \
  --admin-password 'SecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable
```

**Cost:** ~$24/month (2x Burstable B1ms)

### Option B: Shared Database with Schemas

**Use same database, different schemas:**
- Production uses `public` schema
- Dev uses `dev` schema

**In Prisma:**
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "dev"]
}
```

**Environment variables:**
```bash
# Production
DATABASE_URL="postgres://user:pass@host:5432/gamedb?schema=public"

# Dev
DATABASE_URL="postgres://user:pass@host:5432/gamedb?schema=dev"
```

---

## Environment Configuration Summary

### Required Environment Variables

**Both environments need:**
```bash
# App
NODE_ENV=production|development|staging
PORT=8080

# Database
DATABASE_URL=postgres://...

# Auth
OKTA_DOMAIN=dev-123.okta.com
OKTA_CLIENT_ID=abc123
OKTA_CLIENT_SECRET=secret123

# Frontend
FRONTEND_URL=https://your-frontend-url

# APIs
API_KEY=your-odds-api-key

# Push Notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

**Environment-specific differences:**
```bash
# Production
NODE_ENV=production
DATABASE_URL=production-database
FRONTEND_URL=https://app.yourdomain.com

# Dev/Staging
NODE_ENV=staging
DATABASE_URL=staging-database
FRONTEND_URL=https://staging.yourdomain.com
```

---

## Recommended Setup (Best Value)

**For your use case:**

1. **Start Simple** (Total: ~$13/month)
   - Single App Service (B1 tier)
   - Deploy `develop` branch manually when testing
   - Use production for everything else
   - Cheapest option

2. **Add Staging Slot Later** (Total: ~$55/month)
   - When budget allows, upgrade to S1
   - Get deployment slots for testing
   - Professional zero-downtime deployments

3. **Separate Databases Always** (Add ~$12-24/month)
   - Railway: Create two projects/databases
   - Azure: Two Burstable PostgreSQL instances
   - Keeps production data safe

### Simple Workflow (Single App Service)

```bash
# Current setup: Only production exists

# To test changes before production:
# 1. Create 'develop' branch
git checkout -b develop

# 2. Deploy manually to Azure using different tag
# In GitHub Actions, add manual dispatch for 'develop' branch
# Or temporarily change main branch pointer

# 3. Test on production URL (during off-hours)

# 4. When ready, merge to main
git checkout main
git merge develop
git push origin main
# → Auto-deploys to production
```

**When to upgrade:**
- Getting more users? → Add staging slot (S1 tier)
- Need better testing? → Separate dev resources
- Team growing? → Full dev/staging/prod pipeline

---

## Cost Comparison

| Setup | Resources | Monthly Cost |
|-------|-----------|--------------|
| **Single (Basic)** | 1x B1 App Service + ACR | $18 |
| **Slots (Standard)** | 1x S1 App Service + ACR | $60 |
| **Separate (Dev+Prod)** | B1 + S1 App Service + ACR | $73 |
| **+ Separate DBs** | Add 2x PostgreSQL | +$24 |

**My Recommendation:**
- **Now**: Single B1 + Railway DB ($18/mo)
- **When profitable**: Add staging slot ($60/mo)
- **When team grows**: Add separate dev resources ($73/mo)

---

## Quick Reference

### Deploy to Staging (with slots)
```bash
git checkout develop
git add .
git commit -m "Changes"
git push origin develop
# → Auto-deploys to staging slot
# → Test: https://game-squad-backend-staging.azurewebsites.net
```

### Promote Staging to Production (swap)
```bash
# Via Azure Portal:
# Web App → Deployment Slots → Swap
# Takes 30 seconds, zero downtime
```

### Deploy to Production (direct)
```bash
git checkout main
git add .
git commit -m "Changes"
git push origin main
# → Auto-deploys to production
```

### Rollback
```bash
# With slots: Swap back
# Web App → Deployment Slots → Swap (staging ↔ production)

# Without slots: Redeploy previous version
# Web App → Deployment Center → Logs → Redeploy
```

---

## Setup Checklist

### Deployment Slots Approach (Recommended)
- [ ] Upgrade to S1 tier ($55/mo)
- [ ] Create staging slot
- [ ] Configure slot-specific environment variables
- [ ] Create `develop` branch in Git
- [ ] Update GitHub Actions workflow
- [ ] Test deploy to staging
- [ ] Test swap slots
- [ ] Document for team

### Separate Resources Approach
- [ ] Create dev App Service Plan
- [ ] Create dev Web App
- [ ] Create dev database (optional)
- [ ] Configure dev environment variables
- [ ] Update GitHub Actions workflow
- [ ] Test deploy to dev
- [ ] Test deploy to prod
- [ ] Document for team

---

## Troubleshooting

### Slot-specific issues

**Config not swapping correctly:**
- Check "Deployment slot setting" checkbox
- Variables with this checked stay with the slot

**Slot shows old version:**
- Clear browser cache
- Check deployment logs
- Verify correct slot was deployed to

**Swap operation failed:**
- Check app logs for startup errors
- Verify environment variables are correct
- Check database connectivity

---

## For Your Successor

**To deploy to staging:**
1. Push to `develop` branch
2. Check GitHub Actions (green checkmark)
3. Test staging URL
4. If good, merge to `main`

**To promote staging to prod:**
1. Go to Azure Portal
2. Web App → Deployment Slots
3. Click **Swap**
4. Confirm and wait ~30 seconds
5. Done!

**No Docker, no CLI commands needed!**

---

## Next Steps

1. **Decide on approach** (slots vs separate resources)
2. **Set up resources** (follow steps above)
3. **Update GitHub Actions** (use provided workflow)
4. **Test deployment** (push to develop branch)
5. **Document for team** (add to HANDOFF_GUIDE.md)

**Start simple, scale as needed!**
