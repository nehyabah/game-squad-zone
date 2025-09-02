# Azure Setup Script for Game Squad Zone
# Run this script to set up your Azure infrastructure

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$true)]
    [string]$AppName,
    
    [string]$DatabaseSku = "Basic"
)

# Login to Azure (uncomment if not logged in)
# az login

Write-Host "Creating Resource Group..." -ForegroundColor Green
az group create --name $ResourceGroupName --location $Location

Write-Host "Creating Azure Database for PostgreSQL..." -ForegroundColor Green
$dbServerName = "$AppName-db-server"
$dbName = "game_squad_zone"
$dbUsername = "gameadmin"

# Generate a random password
$dbPassword = -join ((33..126) | Get-Random -Count 16 | ForEach {[char]$_})

az postgres server create `
    --resource-group $ResourceGroupName `
    --name $dbServerName `
    --location $Location `
    --admin-user $dbUsername `
    --admin-password $dbPassword `
    --sku-name B_Gen5_1 `
    --storage-size 51200

# Create database
az postgres db create `
    --resource-group $ResourceGroupName `
    --server-name $dbServerName `
    --name $dbName

# Configure firewall to allow Azure services
az postgres server firewall-rule create `
    --resource-group $ResourceGroupName `
    --server-name $dbServerName `
    --name "AllowAzureServices" `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

Write-Host "Creating App Service Plan..." -ForegroundColor Green
$appServicePlan = "$AppName-plan"
az appservice plan create `
    --name $appServicePlan `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku B1 `
    --is-linux

Write-Host "Creating Backend App Service..." -ForegroundColor Green
$backendAppName = "$AppName-api"
az webapp create `
    --resource-group $ResourceGroupName `
    --plan $appServicePlan `
    --name $backendAppName `
    --runtime "NODE|18-lts"

Write-Host "Creating Static Web App for Frontend..." -ForegroundColor Green
$frontendAppName = "$AppName-app"
az staticwebapp create `
    --name $frontendAppName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --source https://github.com/yourusername/game-squad-zone `
    --branch main `
    --app-location "/" `
    --api-location "backend" `
    --output-location "dist"

# Set up App Settings for Backend
Write-Host "Configuring Backend App Settings..." -ForegroundColor Green
$connectionString = "postgresql://$dbUsername`:$dbPassword@$dbServerName.postgres.database.azure.com:5432/$dbName?sslmode=require"

az webapp config appsettings set `
    --resource-group $ResourceGroupName `
    --name $backendAppName `
    --settings `
        NODE_ENV=production `
        DATABASE_PROVIDER=postgresql `
        DATABASE_URL=$connectionString `
        FRONTEND_URL="https://$frontendAppName.azurestaticapps.net" `
        PORT=80

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Database Server: $dbServerName.postgres.database.azure.com" -ForegroundColor Yellow
Write-Host "Database Name: $dbName" -ForegroundColor Yellow
Write-Host "Database Username: $dbUsername" -ForegroundColor Yellow
Write-Host "Database Password: $dbPassword" -ForegroundColor Yellow
Write-Host "Backend URL: https://$backendAppName.azurewebsites.net" -ForegroundColor Yellow
Write-Host "Frontend URL: https://$frontendAppName.azurestaticapps.net" -ForegroundColor Yellow

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Update your .env.production with the database connection string" -ForegroundColor White
Write-Host "2. Deploy your application code" -ForegroundColor White
Write-Host "3. Run database migrations" -ForegroundColor White
Write-Host "4. Configure Auth0 with production URLs" -ForegroundColor White