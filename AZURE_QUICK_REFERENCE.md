# Azure Container Registry - Quick Reference

## Quick Start Commands

### One-Time Setup
```bash
# 1. Login to Azure
az login

# 2. Create resources
az group create --name game-squad-zone-rg --location eastus
az acr create --resource-group game-squad-zone-rg --name gamesquadzone --sku Basic --admin-enabled true

# 3. Create App Service
az appservice plan create --name game-squad-plan --resource-group game-squad-zone-rg --is-linux --sku B1
az webapp create --resource-group game-squad-zone-rg --plan game-squad-plan --name game-squad-backend --deployment-container-image-name gamesquadzone.azurecr.io/game-squad-backend:latest
```

### Regular Deployment
```bash
# 1. Login to ACR
az acr login --name gamesquadzone

# 2. Build and push
cd backend
docker build -t gamesquadzone.azurecr.io/game-squad-backend:latest .
docker push gamesquadzone.azurecr.io/game-squad-backend:latest

# 3. Restart app (if needed)
az webapp restart --name game-squad-backend --resource-group game-squad-zone-rg
```

### View Logs
```bash
# Stream live logs
az webapp log tail --name game-squad-backend --resource-group game-squad-zone-rg

# Download logs
az webapp log download --name game-squad-backend --resource-group game-squad-zone-rg
```

### Update Environment Variables
```bash
az webapp config appsettings set \
  --resource-group game-squad-zone-rg \
  --name game-squad-backend \
  --settings KEY=VALUE
```

---

## Cost Estimates

| Tier | Monthly Cost | Specs | Best For |
|------|--------------|-------|----------|
| B1 (Basic) | ~$13 | 1 core, 1.75GB RAM | Development, small apps |
| B2 (Basic) | ~$26 | 2 cores, 3.5GB RAM | Testing, staging |
| S1 (Standard) | ~$55 | 1 core, 1.75GB RAM | Production (with SSL, slots) |
| P1V2 (Premium) | ~$76 | 1 core, 3.5GB RAM | High-traffic production |

**Additional Costs:**
- ACR Basic: $5/month
- PostgreSQL Burstable: $12/month
- Total minimum: **~$30/month**

---

## URLs After Deployment

- **Backend API**: `https://game-squad-backend.azurewebsites.net`
- **Azure Portal**: https://portal.azure.com
- **ACR Portal**: `https://portal.azure.com/#@/resource/subscriptions/{id}/resourceGroups/game-squad-zone-rg/providers/Microsoft.ContainerRegistry/registries/gamesquadzone`

---

## Common Issues & Fixes

### Container won't start
```bash
# Check logs for errors
az webapp log tail --name game-squad-backend --resource-group game-squad-zone-rg

# Verify environment variables are set
az webapp config appsettings list --name game-squad-backend --resource-group game-squad-zone-rg
```

### Can't push to ACR
```bash
# Re-login to ACR
az acr login --name gamesquadzone

# Verify you have the right permissions
az acr credential show --name gamesquadzone
```

### Database connection fails
```bash
# Check if DATABASE_URL is correct
az webapp config appsettings list --name game-squad-backend --resource-group game-squad-zone-rg --query "[?name=='DATABASE_URL']"

# Test connection from local machine first
```

---

## Cleanup Commands (if needed)

```bash
# Delete everything
az group delete --name game-squad-zone-rg --yes --no-wait

# Delete just the web app
az webapp delete --name game-squad-backend --resource-group game-squad-zone-rg

# Delete just the container registry
az acr delete --name gamesquadzone --resource-group game-squad-zone-rg
```
