# Migrating to Azure Container Registry (ACR)

## Overview

This guide explains how to migrate from your current setup (Docker Desktop + Railway) to Azure Container Registry with Azure hosting.

**Current Setup:**
- Backend: Docker container running locally, deployed to Railway
- Database: PostgreSQL (likely on Railway or external)
- Frontend: (assumed to be separate deployment)

**Target Setup:**
- Backend: Docker image stored in Azure Container Registry (ACR)
- Hosting: Azure Container Instances (ACI) or Azure App Service
- Database: Keep existing PostgreSQL or migrate to Azure Database for PostgreSQL
- CI/CD: GitHub Actions or Azure DevOps

---

## Prerequisites

### 1. Azure Account Setup
- Active Azure subscription ([Sign up for free trial](https://azure.microsoft.com/free/))
- Azure CLI installed locally
- Resource Group created in Azure

### 2. Local Tools Required
- Docker Desktop (you already have this)
- Azure CLI: [Download here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Git (for version control)

### 3. Current Environment Information
- Your database connection string
- All environment variables from Railway
- Domain/DNS configuration (if any)

---

## Step 1: Install Azure CLI

### Windows:
```powershell
# Download and run the MSI installer from:
# https://aka.ms/installazurecliwindows

# Or use winget:
winget install -e --id Microsoft.AzureCLI
```

### Verify Installation:
```bash
az --version
```

---

## Step 2: Login to Azure

```bash
# Login to your Azure account
az login

# Set your subscription (if you have multiple)
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

---

## Step 3: Create Azure Resources

### Create Resource Group
```bash
# Choose a region close to your users (e.g., eastus, westeurope)
az group create \
  --name game-squad-zone-rg \
  --location eastus
```

### Create Azure Container Registry
```bash
# Create ACR (use lowercase, alphanumeric only)
az acr create \
  --resource-group game-squad-zone-rg \
  --name gamesquadzone \
  --sku Basic \
  --admin-enabled true

# Note:
# - Basic SKU costs ~$5/month
# - Standard SKU costs ~$20/month (better performance)
# - Premium SKU costs ~$50/month (geo-replication, advanced features)
```

### Get ACR Credentials
```bash
# Get login server
az acr list --resource-group game-squad-zone-rg --query "[].{acrLoginServer:loginServer}" --output table

# Get admin credentials
az acr credential show --name gamesquadzone --resource-group game-squad-zone-rg
```

**Save these values:**
- Login Server: `gamesquadzone.azurecr.io`
- Username: (from credential show)
- Password: (from credential show)

---

## Step 4: Build and Push Docker Image

### Update Your Dockerfile (if needed)
Ensure your `backend/Dockerfile` is production-ready:

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Start command
CMD ["npm", "start"]
```

### Login to ACR
```bash
# Login to your Azure Container Registry
az acr login --name gamesquadzone
```

### Build and Tag Image
```bash
# Navigate to backend directory
cd backend

# Build the image
docker build -t gamesquadzone.azurecr.io/game-squad-backend:latest .

# Or build with a specific version tag
docker build -t gamesquadzone.azurecr.io/game-squad-backend:v1.0.0 .
```

### Push to ACR
```bash
# Push the latest tag
docker push gamesquadzone.azurecr.io/game-squad-backend:latest

# Push versioned tag (if created)
docker push gamesquadzone.azurecr.io/game-squad-backend:v1.0.0
```

### Verify Image in ACR
```bash
# List repositories
az acr repository list --name gamesquadzone --output table

# List tags for a repository
az acr repository show-tags --name gamesquadzone --repository game-squad-backend --output table
```

---

## Step 5: Choose Deployment Option

You have three main options:

### Option A: Azure Container Instances (ACI) - Simplest
**Best for:** Simple deployments, dev/staging environments
**Cost:** ~$15-30/month (pay per second)
**Pros:** Easy to set up, automatic scaling
**Cons:** Cold starts, limited networking options

### Option B: Azure App Service for Containers
**Best for:** Production apps with custom domains, SSL
**Cost:** ~$13-55/month (depends on tier)
**Pros:** Easy SSL, custom domains, auto-scaling, deployment slots
**Cons:** Slightly more expensive

### Option C: Azure Kubernetes Service (AKS)
**Best for:** Large-scale, microservices, complex deployments
**Cost:** $70+ /month
**Pros:** Most flexible, industry standard
**Cons:** Most complex, overkill for single container

**Recommendation for your app: Option B (Azure App Service)**

---

## Step 6A: Deploy to Azure Container Instances (ACI)

### Create Container Instance
```bash
# Get ACR credentials first
ACR_USERNAME=$(az acr credential show --name gamesquadzone --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name gamesquadzone --query passwords[0].value --output tsv)

# Create container instance
az container create \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend \
  --image gamesquadzone.azurecr.io/game-squad-backend:latest \
  --cpu 1 \
  --memory 1.5 \
  --registry-login-server gamesquadzone.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label game-squad-backend \
  --ports 8080 \
  --environment-variables \
    DATABASE_URL="your-postgres-connection-string" \
    NODE_ENV="production" \
    PORT="8080"
```

### Get Public IP/URL
```bash
az container show \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend \
  --query "{FQDN:ipAddress.fqdn,IP:ipAddress.ip}" \
  --output table
```

Your backend will be available at: `http://game-squad-backend.eastus.azurecontainer.io:8080`

---

## Step 6B: Deploy to Azure App Service (Recommended)

### Create App Service Plan
```bash
# Create Linux App Service Plan
az appservice plan create \
  --name game-squad-plan \
  --resource-group game-squad-zone-rg \
  --is-linux \
  --sku B1

# Note: B1 tier costs ~$13/month, includes:
# - 1 core, 1.75 GB RAM
# - Custom domains & SSL
# - 10 GB storage
```

### Create Web App from Container
```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name gamesquadzone --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name gamesquadzone --query passwords[0].value --output tsv)

# Create web app
az webapp create \
  --resource-group game-squad-zone-rg \
  --plan game-squad-plan \
  --name game-squad-backend \
  --deployment-container-image-name gamesquadzone.azurecr.io/game-squad-backend:latest

# Configure registry credentials
az webapp config container set \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --docker-registry-server-url https://gamesquadzone.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD
```

### Configure Environment Variables
```bash
# Set environment variables (replace with your actual values)
az webapp config appsettings set \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend \
  --settings \
    DATABASE_URL="your-postgres-connection-string" \
    NODE_ENV="production" \
    PORT="8080" \
    OKTA_DOMAIN="your-okta-domain" \
    OKTA_CLIENT_ID="your-client-id" \
    OKTA_CLIENT_SECRET="your-client-secret" \
    API_KEY="your-api-key" \
    FRONTEND_URL="your-frontend-url" \
    VAPID_PUBLIC_KEY="your-vapid-public" \
    VAPID_PRIVATE_KEY="your-vapid-private"
```

### Enable Continuous Deployment
```bash
# Enable CD from ACR
az webapp deployment container config \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --enable-cd true
```

### Get Webhook URL (for CI/CD)
```bash
az webapp deployment container show-cd-url \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg
```

### Get Your App URL
Your backend will be available at: `https://game-squad-backend.azurewebsites.net`

---

## Step 7: Configure Custom Domain (Optional)

### Add Custom Domain
```bash
# First, add CNAME record in your DNS:
# CNAME: api.yourdomain.com -> game-squad-backend.azurewebsites.net

# Then map the domain
az webapp config hostname add \
  --webapp-name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --hostname api.yourdomain.com
```

### Enable Free SSL Certificate
```bash
az webapp config ssl bind \
  --certificate-thumbprint auto \
  --ssl-type SNI \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --hostname api.yourdomain.com
```

---

## Step 8: Setup CI/CD with GitHub Actions

### Create `.github/workflows/azure-deploy.yml`

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: game-squad-backend
  ACR_NAME: gamesquadzone

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to ACR
      run: |
        az acr login --name ${{ env.ACR_NAME }}

    - name: Build and push Docker image
      run: |
        cd backend
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/game-squad-backend:${{ github.sha }} .
        docker build -t ${{ env.ACR_NAME }}.azurecr.io/game-squad-backend:latest .
        docker push ${{ env.ACR_NAME }}.azurecr.io/game-squad-backend:${{ github.sha }}
        docker push ${{ env.ACR_NAME }}.azurecr.io/game-squad-backend:latest

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        images: ${{ env.ACR_NAME }}.azurecr.io/game-squad-backend:${{ github.sha }}
```

### Setup GitHub Secrets

1. Create Azure Service Principal:
```bash
az ad sp create-for-rbac \
  --name "github-actions-game-squad" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/game-squad-zone-rg \
  --sdk-auth
```

2. Copy the JSON output

3. In GitHub: Settings → Secrets → Actions → New repository secret
   - Name: `AZURE_CREDENTIALS`
   - Value: (paste the JSON)

---

## Step 9: Database Migration

### Option A: Keep Existing Railway Database
- Update `DATABASE_URL` in Azure App Settings
- Whitelist Azure App Service outbound IPs in Railway

### Option B: Migrate to Azure Database for PostgreSQL
```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group game-squad-zone-rg \
  --name game-squad-db \
  --location eastus \
  --admin-user adminuser \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32

# Allow Azure services to connect
az postgres flexible-server firewall-rule create \
  --resource-group game-squad-zone-rg \
  --name game-squad-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name game-squad-db
```

**Migrate existing data:**
```bash
# Export from Railway
pg_dump $RAILWAY_DATABASE_URL > backup.sql

# Import to Azure
psql "host=game-squad-db.postgres.database.azure.com port=5432 dbname=postgres user=adminuser password=YourSecurePassword123! sslmode=require" < backup.sql
```

---

## Step 10: Monitor and Scale

### View Logs
```bash
# App Service logs
az webapp log tail \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg

# Container Instance logs
az container logs \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend
```

### Scale App Service
```bash
# Scale up (more powerful instance)
az appservice plan update \
  --name game-squad-plan \
  --resource-group game-squad-zone-rg \
  --sku B2

# Scale out (more instances)
az appservice plan update \
  --name game-squad-plan \
  --resource-group game-squad-zone-rg \
  --number-of-workers 2
```

### Setup Application Insights (Monitoring)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app game-squad-insights \
  --location eastus \
  --resource-group game-squad-zone-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app game-squad-insights \
  --resource-group game-squad-zone-rg \
  --query instrumentationKey

# Add to App Settings
az webapp config appsettings set \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

---

## Cost Comparison

### Current Setup (Railway)
- Railway Hobby: $5/month (500 hours)
- Railway Pro: $20/month + usage

### Azure Setup (Monthly Costs)

**Minimum Setup:**
- ACR Basic: $5
- App Service B1: $13
- PostgreSQL Burstable B1ms: $12
- **Total: ~$30/month**

**Production Setup:**
- ACR Standard: $20
- App Service S1: $55
- PostgreSQL GP D2s_v3: $80
- Application Insights: $2-10
- **Total: ~$155-165/month**

**Cost Optimization Tips:**
- Use ACR Basic for small teams
- Start with B1 App Service, scale as needed
- Use Burstable database tier for dev/staging
- Enable auto-shutdown for non-production resources
- Use Azure Cost Management alerts

---

## Migration Checklist

- [ ] Install Azure CLI
- [ ] Login to Azure and set subscription
- [ ] Create Resource Group
- [ ] Create Azure Container Registry
- [ ] Build and push Docker image to ACR
- [ ] Choose deployment option (ACI vs App Service)
- [ ] Create App Service/Container Instance
- [ ] Configure all environment variables
- [ ] Test backend endpoint
- [ ] Migrate database (if needed)
- [ ] Run Prisma migrations
- [ ] Setup custom domain (optional)
- [ ] Enable SSL certificate
- [ ] Configure GitHub Actions CI/CD
- [ ] Setup monitoring (Application Insights)
- [ ] Configure alerts
- [ ] Update frontend to use new backend URL
- [ ] Decommission Railway deployment
- [ ] Document new deployment process for team

---

## Troubleshooting

### Image won't pull from ACR
```bash
# Verify ACR credentials are correct
az acr credential show --name gamesquadzone

# Test local pull
docker login gamesquadzone.azurecr.io
docker pull gamesquadzone.azurecr.io/game-squad-backend:latest
```

### Container keeps restarting
```bash
# Check logs
az webapp log tail --name game-squad-backend --resource-group game-squad-zone-rg

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port mismatch (ensure PORT=8080)
```

### Database connection issues
- Check if Azure App Service IP is whitelisted
- Verify DATABASE_URL format
- Test connection locally first
- Check PostgreSQL firewall rules

### Performance issues
- Check App Service metrics in Azure Portal
- Upgrade to higher SKU if needed
- Add Application Insights for detailed diagnostics
- Enable caching where possible

---

## Rollback Plan

If something goes wrong, you can quickly rollback:

### 1. Keep Railway Running
Don't shut down Railway until Azure is fully tested

### 2. Rollback Commands
```bash
# Revert to previous image version
az webapp config container set \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --docker-custom-image-name gamesquadzone.azurecr.io/game-squad-backend:v1.0.0

# Or restart with previous deployment slot
az webapp deployment slot swap \
  --name game-squad-backend \
  --resource-group game-squad-zone-rg \
  --slot staging \
  --target-slot production
```

---

## Support and Resources

- **Azure Container Registry docs**: https://docs.microsoft.com/en-us/azure/container-registry/
- **Azure App Service docs**: https://docs.microsoft.com/en-us/azure/app-service/
- **Azure CLI reference**: https://docs.microsoft.com/en-us/cli/azure/
- **Azure pricing calculator**: https://azure.microsoft.com/en-us/pricing/calculator/
- **GitHub Actions for Azure**: https://github.com/Azure/actions

---

## Next Steps After Migration

1. **Setup Staging Environment**: Create a separate deployment slot for testing
2. **Configure Auto-Scaling**: Set rules based on CPU/memory usage
3. **Implement Blue-Green Deployments**: Zero-downtime deployments
4. **Add Health Checks**: Configure liveness and readiness probes
5. **Setup Backup Strategy**: Automated database backups
6. **Configure CDN**: Azure CDN for static assets
7. **Implement Secrets Management**: Azure Key Vault for sensitive data

---

## Questions or Issues?

If you encounter any issues during migration, refer to:
1. Azure Portal logs and diagnostics
2. Application Insights for detailed telemetry
3. GitHub Actions workflow logs
4. Railway logs (for comparison during transition)
