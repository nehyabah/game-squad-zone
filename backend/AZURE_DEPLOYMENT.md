# Azure Deployment Guide for SquadPot Backend

## Prerequisites

1. Azure Account with an active subscription
2. Azure CLI installed locally
3. Node.js 18.x installed
4. Azure App Service created

## Setup Steps

### 1. Create Azure App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name squadpot-rg --location "East US"

# Create App Service Plan
az appservice plan create \
  --name squadpot-plan \
  --resource-group squadpot-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group squadpot-rg \
  --plan squadpot-plan \
  --name squadpot-backend \
  --runtime "NODE|18-lts"
```

### 2. Configure App Settings

```bash
# Set Node version
az webapp config set \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --linux-fx-version "NODE|18-lts"

# Configure app settings from JSON file
az webapp config appsettings set \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --settings @azure-app-settings.json
```

### 3. Configure Database

Update the DATABASE_URL in App Settings with your actual database connection string:

```bash
az webapp config appsettings set \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --settings DATABASE_URL="your-connection-string"
```

### 4. Set Up Deployment

#### Option A: GitHub Actions (Recommended)

1. Get the publish profile:
```bash
az webapp deployment list-publishing-profiles \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --xml > publish-profile.xml
```

2. Add the publish profile to GitHub Secrets:
   - Go to your GitHub repository
   - Settings → Secrets → Actions
   - Add new secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the content of publish-profile.xml

3. Push to main branch to trigger deployment

#### Option B: Azure CLI Deployment

```bash
# Build locally
cd backend
npm ci
npm run build

# Create zip package
zip -r deploy.zip . -x "*.git*" -x "node_modules/*" -x ".env*"

# Deploy
az webapp deployment source config-zip \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --src deploy.zip
```

### 5. Configure Startup Command

Set the startup command:

```bash
az webapp config set \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --startup-file "node dist/src/main.server.js"
```

### 6. Enable Logging

```bash
# Enable application logging
az webapp log config \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --level verbose

# Stream logs
az webapp log tail \
  --resource-group squadpot-rg \
  --name squadpot-backend
```

## Environment Variables

Make sure to set these environment variables in Azure App Service:

- `NODE_ENV`: production
- `PORT`: 8080 (Azure sets this automatically)
- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: Your JWT secret key
- `AUTH0_DOMAIN`: Your Auth0 domain
- `AUTH0_CLIENT_ID`: Your Auth0 client ID
- `AUTH0_CLIENT_SECRET`: Your Auth0 client secret
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `ODDS_API_KEY`: Your Odds API key
- `FRONTEND_URL`: Your frontend URL

## Troubleshooting

### Check Application Logs
```bash
az webapp log tail --resource-group squadpot-rg --name squadpot-backend
```

### SSH into App Service
```bash
az webapp ssh --resource-group squadpot-rg --name squadpot-backend
```

### Restart App Service
```bash
az webapp restart --resource-group squadpot-rg --name squadpot-backend
```

### Check Deployment Status
```bash
az webapp deployment list-publishing-credentials \
  --resource-group squadpot-rg \
  --name squadpot-backend
```

## Important Notes

1. **Database Migrations**: Migrations run automatically during deployment via the postinstall script
2. **Prisma Binary**: Azure requires the `debian-openssl-3.0.x` binary target in prisma schema
3. **Port**: Azure automatically sets the PORT environment variable
4. **CORS**: Make sure to add your frontend domain to CORS settings in the app

## Monitoring

Set up Application Insights for monitoring:

```bash
# Create Application Insights
az monitor app-insights component create \
  --app squadpot-insights \
  --location "East US" \
  --resource-group squadpot-rg

# Link to Web App
az webapp config appsettings set \
  --resource-group squadpot-rg \
  --name squadpot-backend \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```