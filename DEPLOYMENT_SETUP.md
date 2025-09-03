# 🚀 Azure Deployment Setup Guide

This guide provides complete instructions for setting up GitHub Actions deployment to Azure for your SquadPot application.

## 📋 Prerequisites

- ✅ Azure subscription
- ✅ GitHub repository with admin access
- ✅ Azure CLI installed locally (optional)

## 🏗️ Azure Resources Setup

### 1. Create Backend App Service

```bash
# Create resource group
az group create --name squadpot-rg --location "East US"

# Create App Service plan
az appservice plan create \
  --name squadpot-plan \
  --resource-group squadpot-rg \
  --sku B1 \
  --is-linux

# Create backend App Service
az webapp create \
  --resource-group squadpot-rg \
  --plan squadpot-plan \
  --name squadpot-backend \
  --runtime "NODE:18-lts"
```

### 2. Create Frontend Static Web App

```bash
# Create Static Web App
az staticwebapp create \
  --name squadpot-frontend \
  --resource-group squadpot-rg \
  --source https://github.com/nehyabah/game-squad-zone \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

### 3. Create PostgreSQL Database

```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group squadpot-rg \
  --name squadpot-db-server \
  --location "East US" \
  --admin-user squadpot_admin \
  --admin-password "YourSecurePassword123!" \
  --sku-name GP_Gen5_2 \
  --version 13

# Create database
az postgres db create \
  --resource-group squadpot-rg \
  --server-name squadpot-db-server \
  --name squadpot-database

# Configure firewall for Azure services
az postgres server firewall-rule create \
  --resource-group squadpot-rg \
  --server squadpot-db-server \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## 🔐 GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### Required Secrets

#### Azure Deployment Secrets
```
AZURE_BACKEND_PUBLISH_PROFILE
# Get from: Azure Portal → App Service → Deployment Center → Download Publish Profile

AZURE_STATIC_WEB_APPS_API_TOKEN  
# Get from: Azure Portal → Static Web Apps → Deployment tokens
```

#### Database Configuration
```
DATABASE_URL
# Format: postgresql://username:password@server:5432/database?sslmode=require
# Example: postgresql://squadpot_admin:YourPassword@squadpot-db-server.postgres.database.azure.com:5432/squadpot-database?sslmode=require
```

#### Backend Environment Variables
```
JWT_SECRET
# Generate: openssl rand -base64 32
# Example: xK8mP7vQ9nL3wR5tY7uI9oP2sD4fG6hJ8kL0mN3qV5xZ8bC1eF4hJ7kM9nQ2rT5y

OKTA_DOMAIN
# Your Auth0 domain: your-tenant.us.auth0.com

OKTA_CLIENT_ID
# Auth0 application client ID

OKTA_CLIENT_SECRET
# Auth0 application client secret

STRIPE_SECRET_KEY
# Stripe secret key: sk_live_... or sk_test_...

STRIPE_WEBHOOK_SECRET
# Stripe webhook endpoint secret: whsec_...
```

#### Frontend Environment Variables
```
VITE_API_URL
# Backend API URL: https://squadpot-backend.azurewebsites.net/api

VITE_STRIPE_PUBLISHABLE_KEY
# Stripe publishable key: pk_live_... or pk_test_...

VITE_ODDS_API_KEY
# The Odds API key
```

## ⚙️ Azure App Service Configuration

### Backend App Service Settings

1. Go to Azure Portal → App Services → squadpot-backend → Configuration
2. Add these Application Settings:

```
NODE_ENV=production
DATABASE_URL=[your-postgresql-connection-string]
JWT_SECRET=[your-jwt-secret]
OKTA_DOMAIN=[your-auth0-domain]
OKTA_CLIENT_ID=[your-client-id]
OKTA_CLIENT_SECRET=[your-client-secret]
OKTA_REDIRECT_URI=https://squadpot-backend.azurewebsites.net/api/auth/callback
OKTA_ISSUER=https://[your-auth0-domain]
OKTA_AUDIENCE=api://default
STRIPE_SECRET_KEY=[your-stripe-key]
STRIPE_WEBHOOK_SECRET=[your-webhook-secret]
VITE_ODDS_API_KEY=[your-odds-api-key]
FRONTEND_URL=https://[your-static-web-app-url]
ALLOWED_ORIGINS=https://[your-static-web-app-url]
WEBSITE_NODE_DEFAULT_VERSION=~18
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

## 🔧 Local Development Setup

### 1. Update Workflow Configuration

Edit `.github/workflows/backend-azure.yml`:
```yaml
env:
  AZURE_WEBAPP_NAME: 'your-actual-backend-app-name' # UPDATE THIS
```

Edit `.github/workflows/frontend-azure.yml`:
```yaml
# Update health check URL with your actual Static Web App URL
```

### 2. Update Backend CORS Configuration

Edit `backend/src/plugins/cors.ts`:
```typescript
export const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'https://your-static-web-app-url.azurestaticapps.net',
    'http://localhost:3000', // Local development
    'http://localhost:5173'  // Vite dev server
  ],
  credentials: true
}
```

## 🚀 Deployment Process

### Automatic Deployment
1. Push to `main` branch
2. GitHub Actions will automatically:
   - Detect changes in backend/frontend
   - Deploy only changed components
   - Run health checks
   - Generate deployment summary

### Manual Deployment
1. Go to GitHub → Actions → "Full Stack - Complete Azure Deployment"
2. Click "Run workflow"
3. Choose what to deploy:
   - ✅ Deploy Backend
   - ✅ Deploy Frontend
   - ✅ Run Database Migrations

## 🧪 Testing Deployment

### Health Check URLs
- **Backend**: https://squadpot-backend.azurewebsites.net/health
- **Frontend**: https://your-static-web-app.azurestaticapps.net
- **API Test**: https://squadpot-backend.azurewebsites.net/api/health

### Manual Verification
```bash
# Test backend
curl https://squadpot-backend.azurewebsites.net/health

# Test frontend
curl https://your-static-web-app.azurestaticapps.net

# Test CORS
curl -H "Origin: https://your-static-web-app.azurestaticapps.net" \
     https://squadpot-backend.azurewebsites.net/api/health
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Backend Deployment Fails
```bash
# Check App Service logs
az webapp log tail --name squadpot-backend --resource-group squadpot-rg

# Or in Azure Portal: App Service → Log stream
```

#### 2. Database Connection Issues
- Verify DATABASE_URL format
- Check firewall rules allow Azure services
- Ensure SSL mode is required: `?sslmode=require`

#### 3. CORS Errors
- Update CORS configuration in backend
- Verify FRONTEND_URL environment variable
- Check ALLOWED_ORIGINS includes your frontend URL

#### 4. Static Web App Not Loading
- Check build output in GitHub Actions
- Verify staticwebapp.config.json is created
- Check routing configuration

### Debug Commands

```bash
# Check deployment status
az webapp deployment list --name squadpot-backend --resource-group squadpot-rg

# Restart app services
az webapp restart --name squadpot-backend --resource-group squadpot-rg

# View app service logs
az webapp log download --name squadpot-backend --resource-group squadpot-rg
```

## 📊 Monitoring

### Application Insights (Recommended)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app squadpot-insights \
  --location "East US" \
  --resource-group squadpot-rg \
  --kind web
```

### Health Monitoring
- Backend: Built-in `/health` endpoint
- Frontend: Static Web Apps built-in monitoring
- Database: Azure Database for PostgreSQL metrics

## 🎯 Next Steps

1. ✅ Set up all Azure resources
2. ✅ Configure GitHub secrets
3. ✅ Update workflow configuration files
4. ✅ Test deployment with a small change
5. ✅ Set up monitoring and alerts
6. ✅ Configure custom domain (optional)
7. ✅ Set up SSL certificates (handled automatically by Azure)

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review Azure App Service logs
3. Verify all secrets are configured correctly
4. Test individual components manually
5. Check database connectivity

---

🎉 **You're ready to deploy!** Push to main branch or run the workflow manually to start your first deployment.