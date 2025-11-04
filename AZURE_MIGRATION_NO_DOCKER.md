# Azure Migration - No Local Docker Required

## Overview

This guide shows you how to deploy to Azure Container Registry **without needing Docker Desktop on your machine**. Everything happens in the cloud via GitHub Actions.

**Key Principle:** Push code to GitHub → GitHub builds Docker image → Deploys to Azure automatically

---

## What Happens When You Leave?

### The Good News
Once this is set up, **anyone with basic Git knowledge** can deploy:
1. They push code to GitHub
2. GitHub Actions automatically builds and deploys
3. No Docker, Azure CLI, or special tools needed on their machine

### Knowledge Transfer Checklist

#### 1. **Access Transfer**
- [ ] Add new person as admin to Azure subscription
- [ ] Add them to GitHub repository with write access
- [ ] Share Azure Portal credentials (use password manager)
- [ ] Document where secrets/env vars are stored

#### 2. **Documentation** (this guide + others)
- [ ] `AZURE_DEPLOYMENT.md` - How the system works
- [ ] `DEPLOYMENT_GUIDE.md` - How to make changes and deploy
- [ ] `TROUBLESHOOTING.md` - Common issues and fixes
- [ ] `ENVIRONMENT_VARIABLES.md` - List of all env vars and what they do

#### 3. **Runbooks**
- [ ] How to deploy a change
- [ ] How to rollback a deployment
- [ ] How to check if the app is running
- [ ] How to view logs
- [ ] Emergency contacts

#### 4. **No Single Points of Failure**
- [ ] Use company Azure subscription (not personal)
- [ ] Use organization GitHub account (not personal)
- [ ] Use company email for all accounts
- [ ] Have at least 2 people with admin access
- [ ] Store credentials in company password manager (1Password, LastPass, etc.)

---

## Architecture Overview

```
Developer → Push to GitHub → GitHub Actions → Builds Docker Image →
Pushes to Azure Container Registry → Deploys to Azure App Service →
App is live
```

**What you need on your computer:** Git (that's it!)

---

## Step 1: Initial Azure Setup (One-Time)

**Note:** This is the ONLY time you need Azure CLI. After this, everything is automated.

### Option A: Use Azure Cloud Shell (No installation needed!)

1. Go to https://portal.azure.com
2. Click the **Cloud Shell** icon (top right, looks like `>_`)
3. Choose **Bash**
4. Run these commands:

```bash
# Create resource group
az group create \
  --name game-squad-zone-rg \
  --location eastus

# Create container registry
az acr create \
  --resource-group game-squad-zone-rg \
  --name gamesquadzone \
  --sku Basic \
  --admin-enabled true

# Create app service plan
az appservice plan create \
  --name game-squad-plan \
  --resource-group game-squad-zone-rg \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  --resource-group game-squad-zone-rg \
  --plan game-squad-plan \
  --name game-squad-backend \
  --deployment-container-image-name gamesquadzone.azurecr.io/game-squad-backend:latest

# Get ACR credentials (save these!)
az acr credential show --name gamesquadzone --resource-group game-squad-zone-rg
```

### Option B: Ask IT/DevOps to Set It Up
Send them this list:
- Resource Group: `game-squad-zone-rg` in `eastus`
- Container Registry: `gamesquadzone` (Basic SKU, admin enabled)
- App Service Plan: `game-squad-plan` (Linux, B1 tier)
- Web App: `game-squad-backend` (Linux container)

---

## Step 2: Configure Azure Web App

### Via Azure Portal (No CLI needed)

1. Go to https://portal.azure.com
2. Navigate to **Resource Groups** → `game-squad-zone-rg` → `game-squad-backend`
3. Go to **Configuration** in the left menu
4. Click **+ New application setting** for each variable:

```
DATABASE_URL = your-postgresql-connection-string
NODE_ENV = production
PORT = 8080
OKTA_DOMAIN = your-okta-domain
OKTA_CLIENT_ID = your-client-id
OKTA_CLIENT_SECRET = your-client-secret
API_KEY = your-api-key
FRONTEND_URL = https://yourdomain.com
VAPID_PUBLIC_KEY = your-vapid-public-key
VAPID_PRIVATE_KEY = your-vapid-private-key
```

5. Click **Save** at the top

### Configure Container Settings

1. Still in the Web App, go to **Deployment Center**
2. Select **Container settings**:
   - **Registry**: Azure Container Registry
   - **Registry name**: gamesquadzone
   - **Image**: game-squad-backend
   - **Tag**: latest
3. Enable **Continuous deployment**: ON
4. Click **Save**

---

## Step 3: Setup GitHub Actions (The Magic Part)

This is where we eliminate the need for local Docker!

### Create Service Principal for GitHub

**Via Azure Cloud Shell:**
```bash
# Create service principal and save the output!
az ad sp create-for-rbac \
  --name "github-game-squad-deploy" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/game-squad-zone-rg \
  --sdk-auth
```

**Copy the entire JSON output** - you'll need it for GitHub.

### Get ACR Credentials

```bash
# Get username
az acr credential show --name gamesquadzone --query username -o tsv

# Get password
az acr credential show --name gamesquadzone --query passwords[0].value -o tsv
```

**Save these values!**

### Add Secrets to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click **New repository secret** for each:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | The entire JSON output from service principal creation |
| `ACR_NAME` | `gamesquadzone` |
| `ACR_USERNAME` | Username from previous step |
| `ACR_PASSWORD` | Password from previous step |
| `AZURE_WEBAPP_NAME` | `game-squad-backend` |

### Create GitHub Actions Workflow

Create `.github/workflows/deploy-azure.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-azure.yml'
  workflow_dispatch:  # Allows manual trigger from GitHub UI

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    # 1. Checkout code
    - name: Checkout repository
      uses: actions/checkout@v4

    # 2. Login to Azure
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    # 3. Login to Azure Container Registry
    - name: Login to ACR
      uses: docker/login-action@v3
      with:
        registry: ${{ secrets.ACR_NAME }}.azurecr.io
        username: ${{ secrets.ACR_USERNAME }}
        password: ${{ secrets.ACR_PASSWORD }}

    # 4. Build and push Docker image (NO LOCAL DOCKER NEEDED!)
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: |
          ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:latest
          ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:${{ github.sha }}

    # 5. Deploy to Azure Web App
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
        images: ${{ secrets.ACR_NAME }}.azurecr.io/game-squad-backend:${{ github.sha }}

    # 6. Logout from Azure
    - name: Logout from Azure
      run: az logout
```

**Commit and push this file to GitHub!**

---

## Step 4: Test the Deployment

### Trigger a Deployment

1. Make a small change to your backend code
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```

3. Go to GitHub → Actions tab
4. Watch the deployment happen in real-time!

### Verify It Worked

1. Check GitHub Actions for green checkmark ✅
2. Visit: `https://game-squad-backend.azurewebsites.net/health` (or your health endpoint)
3. Check logs in Azure Portal:
   - Go to your Web App → Log stream

---

## How Deployments Work (For Your Successor)

### Normal Workflow (No Docker Needed!)

1. Developer makes code changes
2. Developer commits and pushes to GitHub:
   ```bash
   git add .
   git commit -m "Fix bug in user authentication"
   git push
   ```
3. **That's it!** GitHub Actions automatically:
   - Builds the Docker image (in the cloud)
   - Pushes to Azure Container Registry
   - Deploys to production
   - Takes ~5-10 minutes

### Manual Deployment from GitHub UI

If someone needs to redeploy without code changes:

1. Go to GitHub repository
2. Click **Actions** tab
3. Click **Deploy to Azure** workflow
4. Click **Run workflow** button
5. Select branch and click **Run workflow**

**No terminal commands needed!**

---

## Viewing Logs (No Azure CLI Required)

### Via Azure Portal

1. Go to https://portal.azure.com
2. Search for `game-squad-backend`
3. Click on **Log stream** in the left menu
4. See live logs in your browser

### Via GitHub Actions

1. Go to repository → Actions tab
2. Click on any workflow run
3. Click on the job to see detailed logs

---

## Troubleshooting Guide

### Deployment Failed in GitHub Actions

1. Go to Actions tab
2. Click on failed run
3. Click on the failing step
4. Read error message
5. Common fixes:
   - **"Permission denied"**: Check Azure credentials in secrets
   - **"Image not found"**: ACR credentials might be wrong
   - **"Authentication failed"**: Regenerate service principal

### App Won't Start

1. Check logs in Azure Portal (Log stream)
2. Common issues:
   - Missing environment variable
   - Database connection failed
   - Port mismatch (must be 8080)

### How to Rollback

**Via Azure Portal:**
1. Go to Web App → Deployment Center
2. Click **Logs** tab
3. Find previous successful deployment
4. Click **Redeploy**

**Via GitHub:**
1. Revert the commit that broke things
2. Push to main
3. Automatic deployment with old code

---

## Cost Monitoring (No Surprises!)

### Set Up Budget Alerts

1. Go to Azure Portal → Cost Management + Billing
2. Click **Budgets**
3. Click **+ Add**
4. Set budget: $50/month (or your limit)
5. Set alerts at: 50%, 80%, 100%
6. Add email addresses for alerts

### Current Resources Cost

| Resource | Monthly Cost |
|----------|--------------|
| ACR Basic | $5 |
| App Service B1 | $13 |
| Database (Railway) | $0-20 |
| **Total** | **$18-38/month** |

---

## Succession Plan - For Your Replacement

### Day 1: Access
- [ ] Login to Azure Portal: https://portal.azure.com
- [ ] Login to GitHub: (company org)
- [ ] Get password manager access
- [ ] Get added to Azure subscription

### Day 2: Understand the Setup
- [ ] Read this document
- [ ] Check GitHub Actions history
- [ ] View Azure resources in portal
- [ ] Look at application logs

### Day 3: Make a Test Change
- [ ] Create a test branch
- [ ] Make a small code change
- [ ] Push to GitHub
- [ ] Watch it deploy automatically

### Week 1: Be Comfortable With
- [ ] Viewing logs
- [ ] Understanding deployment process
- [ ] Rolling back a bad deployment
- [ ] Adding/changing environment variables
- [ ] Monitoring costs

### What They DON'T Need to Know
- ❌ How Docker works internally
- ❌ Azure CLI commands (portal is fine)
- ❌ Container architecture
- ❌ Kubernetes or complex DevOps

### What They DO Need to Know
- ✅ How to push code to GitHub
- ✅ How to check if deployment succeeded
- ✅ Where to view logs
- ✅ How to rollback
- ✅ Where environment variables are stored

---

## Emergency Contacts & Resources

### If Something Breaks

1. **Check Status**:
   - Azure Status: https://status.azure.com
   - GitHub Status: https://www.githubstatus.com

2. **Rollback** (if recently deployed):
   - Portal → Web App → Deployment Center → Logs → Redeploy

3. **Check Logs**:
   - Portal → Web App → Log stream

4. **Get Help**:
   - Azure Support (if you have support plan)
   - Stack Overflow: [azure-web-app-service]
   - GitHub Community

### Important Links

- Azure Portal: https://portal.azure.com
- Container Registry: `https://portal.azure.com/#@/resource/subscriptions/{id}/resourceGroups/game-squad-zone-rg/providers/Microsoft.ContainerRegistry/registries/gamesquadzone`
- Web App: `https://portal.azure.com/#@/resource/subscriptions/{id}/resourceGroups/game-squad-zone-rg/providers/Microsoft.Web/sites/game-squad-backend`
- GitHub Actions: `https://github.com/[your-org]/[your-repo]/actions`

---

## Simple Deployment Checklist (For New Person)

### To Deploy a Change:

```bash
# 1. Make your code changes

# 2. Test locally (optional)
cd backend
npm install
npm run dev

# 3. Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# 4. Wait 5-10 minutes

# 5. Check GitHub Actions tab for green checkmark ✅

# 6. Test the live site
curl https://game-squad-backend.azurewebsites.net/health
```

**That's it! No Docker, no Azure CLI, no complex commands.**

---

## Documentation to Leave Behind

Create a `docs/` folder with:

1. **`DEPLOYMENT.md`** (this document)
2. **`ARCHITECTURE.md`** - How the app works
3. **`ENVIRONMENT_VARIABLES.md`** - List all env vars with descriptions
4. **`TROUBLESHOOTING.md`** - Common issues and fixes
5. **`RUNBOOK.md`** - Step-by-step guides for common tasks

### Environment Variables Template

Create `docs/ENVIRONMENT_VARIABLES.md`:

```markdown
# Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | PostgreSQL connection | postgres://... | Yes |
| NODE_ENV | Environment | production | Yes |
| PORT | Server port | 8080 | Yes |
| OKTA_DOMAIN | Auth domain | dev-123.okta.com | Yes |
| OKTA_CLIENT_ID | OAuth client | abc123 | Yes |
| OKTA_CLIENT_SECRET | OAuth secret | secret123 | Yes |
| FRONTEND_URL | Frontend URL | https://app.com | Yes |
| API_KEY | Odds API key | your-key | Yes |
| VAPID_PUBLIC_KEY | Push notifications | BN... | Yes |
| VAPID_PRIVATE_KEY | Push notifications | ab... | Yes |

## How to Update

1. Go to Azure Portal
2. Navigate to Web App
3. Click Configuration
4. Update value
5. Click Save
6. App will restart automatically
```

---

## Advantages of This Approach

### For You (Current Developer)
- ✅ No Docker Desktop needed on your machine
- ✅ No Azure CLI to remember
- ✅ Just push code and it deploys
- ✅ Easy to hand off when you leave

### For Your Replacement
- ✅ Uses tools they already know (Git)
- ✅ Self-documenting (GitHub Actions shows exactly what happens)
- ✅ Can deploy from GitHub web UI (no terminal needed)
- ✅ Azure Portal is visual and intuitive
- ✅ Can't accidentally break things (rollback is easy)

### For The Company
- ✅ Not dependent on one person's machine
- ✅ Multiple people can manage it
- ✅ Audit trail of all deployments
- ✅ Professional CI/CD setup
- ✅ Scalable as team grows

---

## Summary

**What you need locally:** Git
**What happens in the cloud:** Everything else
**What your replacement needs to know:** Git + Azure Portal basics
**Time to hand off:** 1 day
**Bus factor:** Low (anyone with Git knowledge can deploy)

Once this is set up, managing the application is as simple as:
1. Make changes
2. Git push
3. Wait for green checkmark
4. Done!

No Docker, no CLI tools, no complex DevOps knowledge required.
