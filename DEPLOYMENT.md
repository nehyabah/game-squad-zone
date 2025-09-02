# Production Deployment Guide - Game Squad Zone

## 🚀 Azure Deployment Options

### Option 1: Azure App Service + PostgreSQL (Recommended)
**Best for**: Scalable production applications with managed database

### Option 2: Azure Container Instances + Azure SQL
**Best for**: Dockerized deployments with enterprise database

### Option 3: Azure Static Web Apps + Serverless Functions
**Best for**: JAMstack approach with serverless backend

---

## 📋 Prerequisites

1. **Azure CLI installed**
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Login to Azure
   az login
   ```

2. **Node.js 18+ installed**
3. **Git repository set up**
4. **Auth0 production tenant**
5. **Stripe live account (if using payments)**

---

## 🏗️ Step 1: Set Up Azure Infrastructure

### Using PowerShell Script (Recommended)
```powershell
# Run the Azure setup script
./deploy/azure-setup.ps1 -ResourceGroupName "game-squad-zone-rg" -Location "East US" -AppName "game-squad-zone"
```

### Manual Setup
```bash
# Create resource group
az group create --name game-squad-zone-rg --location eastus

# Create PostgreSQL server
az postgres server create \
    --resource-group game-squad-zone-rg \
    --name game-squad-zone-db \
    --location eastus \
    --admin-user gameadmin \
    --admin-password 'YourSecurePassword123!' \
    --sku-name B_Gen5_1

# Create database
az postgres db create \
    --resource-group game-squad-zone-rg \
    --server-name game-squad-zone-db \
    --name game_squad_zone

# Create App Service Plan
az appservice plan create \
    --name game-squad-zone-plan \
    --resource-group game-squad-zone-rg \
    --sku B1 --is-linux

# Create backend app service
az webapp create \
    --resource-group game-squad-zone-rg \
    --plan game-squad-zone-plan \
    --name game-squad-zone-api \
    --runtime "NODE|18-lts"
```

---

## 🔧 Step 2: Configure Environment Variables

### Backend (.env.production)
Update the `.env.production` file with your production values:

```env
NODE_ENV=production
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://gameadmin:YourPassword@game-squad-zone-db.postgres.database.azure.com:5432/game_squad_zone?sslmode=require

# Auth0 Production Settings
OKTA_DOMAIN=your-prod-domain.auth0.com
OKTA_CLIENT_ID=your-production-client-id
OKTA_CLIENT_SECRET=your-production-client-secret
OKTA_REDIRECT_URI=https://game-squad-zone-api.azurewebsites.net/api/auth/callback

# Frontend URL
FRONTEND_URL=https://game-squad-zone-app.azurestaticapps.net

# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Set Azure App Settings
```bash
az webapp config appsettings set \
    --resource-group game-squad-zone-rg \
    --name game-squad-zone-api \
    --settings @.env.production
```

---

## 🗄️ Step 3: Database Setup

### Run Migrations
```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL="postgresql://gameadmin:YourPassword@game-squad-zone-db.postgres.database.azure.com:5432/game_squad_zone?sslmode=require"

# Run migrations
cd backend
npm run migrate:prod
```

### Alternative: Migration via Azure CLI
```bash
az webapp config appsettings set \
    --resource-group game-squad-zone-rg \
    --name game-squad-zone-api \
    --settings WEBSITE_RUN_FROM_PACKAGE=1

# SSH into the app service and run migrations
az webapp ssh --resource-group game-squad-zone-rg --name game-squad-zone-api
```

---

## 📦 Step 4: Deploy Applications

### Backend Deployment
```bash
# Build the application
cd backend
npm run build

# Create deployment package
zip -r backend.zip . -x "node_modules/*" "src/*" "*.ts"

# Deploy to Azure App Service
az webapp deployment source config-zip \
    --resource-group game-squad-zone-rg \
    --name game-squad-zone-api \
    --src backend.zip
```

### Frontend Deployment (Static Web App)
```bash
# Build frontend
npm run build

# Deploy using Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli
swa deploy ./dist --app-name game-squad-zone-app
```

---

## 🔐 Step 5: Configure Auth0 for Production

1. **Create Production Tenant** in Auth0
2. **Configure Application Settings**:
   - Allowed Callback URLs: `https://game-squad-zone-api.azurewebsites.net/api/auth/callback`
   - Allowed Logout URLs: `https://game-squad-zone-app.azurestaticapps.net`
   - Allowed Web Origins: `https://game-squad-zone-app.azurestaticapps.net`

3. **Update Environment Variables** with production Auth0 credentials

---

## 🔍 Step 6: Monitoring & Health Checks

### Application Insights
```bash
# Enable Application Insights
az webapp config appsettings set \
    --resource-group game-squad-zone-rg \
    --name game-squad-zone-api \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

### Health Check Endpoint
Add to your backend:
```javascript
// Health check endpoint
app.get('/health', async (req, reply) => {
  try {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    reply.status(500);
    return { status: 'unhealthy', error: error.message };
  }
});
```

---

## 🔄 Step 7: CI/CD Pipeline

### GitHub Actions (Alternative to Azure DevOps)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Build Backend
      run: |
        cd backend
        npm ci
        npm run build
        
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: game-squad-zone-api
        slot-name: production
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: backend
```

---

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Fails**
   ```bash
   # Check firewall rules
   az postgres server firewall-rule list \
       --resource-group game-squad-zone-rg \
       --server-name game-squad-zone-db
   ```

2. **App Service Not Starting**
   ```bash
   # Check logs
   az webapp log tail \
       --resource-group game-squad-zone-rg \
       --name game-squad-zone-api
   ```

3. **Environment Variables Not Loading**
   ```bash
   # Verify app settings
   az webapp config appsettings list \
       --resource-group game-squad-zone-rg \
       --name game-squad-zone-api
   ```

---

## 💰 Cost Optimization

### Development/Staging Environment
- **App Service**: Basic B1 ($13.14/month)
- **PostgreSQL**: Basic ($22/month)
- **Static Web App**: Free tier
- **Total**: ~$35/month

### Production Environment
- **App Service**: Standard S1 ($73/month)
- **PostgreSQL**: General Purpose GP_Gen5_2 ($58/month)
- **Static Web App**: Standard ($9/month)
- **Total**: ~$140/month

### Scaling Considerations
- Use **Azure Autoscale** for App Service
- Consider **Azure Database for PostgreSQL Flexible Server** for better performance
- Implement **CDN** for static assets
- Use **Azure Redis Cache** for session storage

---

## 🚀 Go Live Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Auth0 production tenant set up
- [ ] SSL certificates active
- [ ] Domain name configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security scan passed

---

## 📞 Support

For deployment issues:
1. Check Azure App Service logs
2. Verify database connectivity
3. Confirm environment variables
4. Test API endpoints
5. Check Auth0 configuration

**Need help?** Create an issue in the repository with deployment logs and error messages.