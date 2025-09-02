# Azure Deployment Guide

This guide will help you deploy the Game Squad Zone application to Azure using GitHub Actions.

## Prerequisites

- Azure subscription
- Azure App Service (for backend)
- Azure Database for PostgreSQL (for database)
- Azure Static Web Apps (for frontend)
- GitHub repository with Actions enabled

## Azure Resources Setup

### 1. Backend (Azure App Service)

```bash
# Create resource group
az group create --name rg-squadpot --location eastus

# Create App Service Plan
az appservice plan create --name plan-squadpot --resource-group rg-squadpot --sku B1 --is-linux

# Create App Service
az webapp create --resource-group rg-squadpot --plan plan-squadpot --name squadpot-api --runtime "NODE:18-lts"
```

### 2. Database (Azure Database for PostgreSQL)

```bash
# Create PostgreSQL server
az postgres server create --resource-group rg-squadpot --name squadpot-server --location eastus --admin-user squadpot --admin-password YourSecurePassword123! --sku-name B_Gen5_1

# Create database
az postgres db create --resource-group rg-squadpot --server-name squadpot-server --name squadpot-database
```

### 3. Frontend (Azure Static Web Apps)

1. Go to Azure Portal → Static Web Apps
2. Create new Static Web App
3. Connect to your GitHub repository
4. Set build details:
   - App location: `/`
   - Api location: (leave empty)
   - Output location: `dist`

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

### Required Secrets

| Secret Name | Description | Where to get it |
|-------------|-------------|-----------------|
| `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND` | App Service publish profile | Azure Portal → App Service → Get publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web Apps deployment token | Azure Portal → Static Web App → Manage deployment token |
| `AZURE_RESOURCE_GROUP` | Resource group name | `rg-squadpot` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://squadpot:YourPassword@squadpot-server.postgres.database.azure.com:5432/squadpot-database?sslmode=require` |

### Environment Secrets

| Secret Name | Value |
|-------------|-------|
| `JWT_SECRET` | `squadpot-super-secure-production-jwt-secret-key-2024-must-be-at-least-32-characters-long` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `VITE_ODDS_API_KEY` | `ec09520b2ad270c9b1e12e7d2181a7d2` |
| `VITE_API_URL` | `https://squadpot-api.azurewebsites.net` |
| `OKTA_CLIENT_SECRET` | Your Auth0 client secret |

## App Service Configuration

Set these environment variables in your App Service:

```bash
az webapp config appsettings set --name squadpot-api --resource-group rg-squadpot --settings \
  NODE_ENV=production \
  WEBSITE_NODE_DEFAULT_VERSION=~18 \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  DATABASE_URL="postgresql://squadpot:YourPassword@squadpot-server.postgres.database.azure.com:5432/squadpot-database?sslmode=require" \
  JWT_SECRET="squadpot-super-secure-production-jwt-secret-key-2024-must-be-at-least-32-characters-long" \
  FRONTEND_URL="https://squadpot-frontend.azurestaticapps.net" \
  ALLOWED_ORIGINS="https://squadpot-frontend.azurestaticapps.net"
```

## Deployment Process

1. **Push to main branch** - This triggers the GitHub Actions
2. **Backend deployment** - Builds and deploys to App Service
3. **Frontend deployment** - Builds and deploys to Static Web Apps
4. **Database migrations** - Runs automatically on backend deployment

## Monitoring

- **App Service logs**: Azure Portal → App Service → Log stream
- **GitHub Actions**: Repository → Actions tab
- **Static Web Apps**: Azure Portal → Static Web App → Functions

## Troubleshooting

### Backend Issues
1. Check App Service logs in Azure Portal
2. Verify environment variables are set correctly
3. Ensure database connection string is correct

### Frontend Issues
1. Check Static Web Apps build logs
2. Verify API URL is correct
3. Check CORS settings in backend

### Database Issues
1. Verify PostgreSQL server allows connections
2. Check firewall rules
3. Test connection string locally

## Database Migration

The backend deployment automatically runs database migrations. If you need to run them manually:

```bash
# Connect to your App Service via SSH or use Azure CLI
az webapp ssh --name squadpot-api --resource-group rg-squadpot

# Inside the container
npm run migrate:deploy
```

## SSL/HTTPS

- App Service comes with HTTPS enabled by default
- Static Web Apps automatically provides HTTPS
- Update CORS settings to use HTTPS URLs only

## Custom Domains (Optional)

1. **App Service**: Azure Portal → App Service → Custom domains
2. **Static Web Apps**: Azure Portal → Static Web App → Custom domains

## Scaling

- **App Service**: Increase App Service Plan size in Azure Portal
- **Database**: Scale up PostgreSQL server in Azure Portal
- **Static Web Apps**: Automatically scales

## Cost Optimization

- Use Basic tier for development
- Scale up for production
- Monitor usage in Azure Cost Management