# Game Squad Zone - Handoff Guide

**For the next developer taking over this project**

---

## TL;DR - How to Deploy

```bash
# 1. Make your changes
# 2. Commit and push
git add .
git commit -m "Your change description"
git push origin main

# 3. Go to GitHub → Actions tab
# 4. Wait for green checkmark ✅
# 5. Done! App is deployed
```

**No Docker, no Azure CLI, no complex tools needed!**

---

## What You Need Access To

### Day 1 Checklist
- [ ] GitHub repository access (ask current maintainer)
- [ ] Azure Portal access (ask IT/admin)
- [ ] Company password manager (for secrets)
- [ ] Railway access (for database, if applicable)

### Login URLs
- **Azure Portal**: https://portal.azure.com
- **GitHub**: https://github.com/[your-org]/game-squad-zone
- **Production App**: https://game-squad-backend.azurewebsites.net

---

## Architecture in 3 Sentences

1. **Frontend**: Users interact with a React app
2. **Backend**: Node.js/Express API hosted on Azure App Service
3. **Database**: PostgreSQL database (on Railway or Azure)

**Deployment**: Push code to GitHub → GitHub Actions builds & deploys → Live in ~5 minutes

---

## How Deployments Work

### Automatic Deployments
Every push to `main` branch automatically:
1. Triggers GitHub Actions workflow
2. Builds Docker container in the cloud
3. Pushes to Azure Container Registry
4. Deploys to Azure App Service
5. App is live

**You don't run any commands!** Just push code.

### Manual Deployment (from GitHub UI)
1. Go to repository
2. Click **Actions** tab
3. Click **Deploy to Azure** workflow
4. Click **Run workflow**
5. Select `main` branch
6. Click **Run workflow** button

---

## Where Everything Lives

### Code
- **Repository**: GitHub (company org)
- **Branch**: `main` is production
- **Backend code**: `/backend` folder
- **Frontend code**: `/src` folder

### Infrastructure
- **Azure Resource Group**: `game-squad-zone-rg`
- **Container Registry**: `gamesquadzone.azurecr.io`
- **Web App**: `game-squad-backend`
- **Database**: Railway PostgreSQL (or Azure)

### Secrets & Config
- **GitHub Secrets**: Repository → Settings → Secrets
- **Azure Config**: Portal → Web App → Configuration
- **Environment Variables**: Listed in `docs/ENVIRONMENT_VARIABLES.md`

---

## Common Tasks

### View Application Logs
**Option 1: Azure Portal**
1. Go to https://portal.azure.com
2. Search for "game-squad-backend"
3. Click **Log stream** in left menu

**Option 2: GitHub Actions**
1. Go to Actions tab
2. Click on latest workflow run
3. View step-by-step logs

### Update Environment Variable
1. Go to Azure Portal
2. Navigate to `game-squad-backend`
3. Click **Configuration** → **Application settings**
4. Find variable and click to edit
5. Click **Save** (app will restart)

### Rollback a Bad Deployment
**Option 1: Git Revert**
```bash
git revert HEAD
git push origin main
# Automatic deployment with reverted code
```

**Option 2: Azure Portal**
1. Go to Web App → **Deployment Center**
2. Click **Logs** tab
3. Find previous working deployment
4. Click **Redeploy**

### Check App Health
```bash
curl https://game-squad-backend.azurewebsites.net/health
```

Or visit in browser.

---

## If Something Breaks

### 1. Check Deployment Status
- GitHub Actions: Did the workflow succeed?
- Azure Portal: Is the app running?
- Logs: Any error messages?

### 2. Common Issues

**"App won't start"**
- Check logs in Azure Portal
- Verify environment variables are set
- Check database connection

**"Deployment failed"**
- Check GitHub Actions logs
- Look for red X and error message
- Common: wrong secrets or permissions

**"504 Gateway Timeout"**
- App is starting (takes 30-60 seconds on first request)
- Or app crashed (check logs)

### 3. Emergency Rollback
Use Azure Portal → Deployment Center → Redeploy previous version

---

## Important Files

| File | Purpose |
|------|---------|
| `AZURE_MIGRATION_NO_DOCKER.md` | Complete deployment guide |
| `AZURE_QUICK_REFERENCE.md` | Quick command reference |
| `backend/Dockerfile` | Container definition |
| `.github/workflows/deploy-azure.yml` | Deployment automation |
| `docs/ENVIRONMENT_VARIABLES.md` | All env vars explained |

---

## Monitoring & Costs

### Current Monthly Costs
- Azure App Service B1: ~$13
- Azure Container Registry: ~$5
- Database (Railway): ~$0-20
- **Total: ~$18-38/month**

### Cost Alerts
- Budget alerts are set up in Azure
- Email sent at 50%, 80%, 100% of budget
- Monitor in: Azure Portal → Cost Management

### Health Checks
- App Service has automatic health monitoring
- Check: Azure Portal → Web App → Metrics
- Uptime, response time, error rate visible

---

## Development Workflow

### Local Development
```bash
# Install dependencies
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your local values

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

### Making Changes
1. Create feature branch: `git checkout -b feature/my-change`
2. Make changes
3. Test locally
4. Commit: `git commit -m "Description"`
5. Push: `git push origin feature/my-change`
6. Create Pull Request on GitHub
7. After approval, merge to `main`
8. Automatic deployment!

---

## Week 1 Goals

### Day 1: Get Access
- [ ] Clone repository
- [ ] Get Azure Portal access
- [ ] View application logs
- [ ] Access GitHub Actions

### Day 2: Understand Setup
- [ ] Read AZURE_MIGRATION_NO_DOCKER.md
- [ ] Explore Azure Portal
- [ ] View recent deployments
- [ ] Check environment variables

### Day 3: Make Test Change
- [ ] Create test branch
- [ ] Make small change (e.g., update README)
- [ ] Push to GitHub
- [ ] Watch deployment happen
- [ ] Verify change is live

### Day 4: Practice Operations
- [ ] View logs in Azure Portal
- [ ] Trigger manual deployment
- [ ] Update an environment variable
- [ ] Check application metrics

### Day 5: Emergency Response
- [ ] Practice rolling back
- [ ] Find error in logs
- [ ] Restart app service
- [ ] Feel comfortable with basics

---

## Who to Ask For Help

### Azure Issues
- Azure Support (if company has support plan)
- Azure documentation: https://docs.microsoft.com/azure
- Stack Overflow: [azure-web-app-service]

### GitHub Actions Issues
- GitHub docs: https://docs.github.com/actions
- Check workflow file: `.github/workflows/deploy-azure.yml`

### Application Issues
- Check application logs first
- Review error messages
- Check database connection
- Verify environment variables

### Access Issues
- IT department for Azure access
- GitHub org admin for repository access
- Current maintainer for password manager

---

## Red Flags (Things to Watch For)

🚩 **Cost suddenly increases**
- Check Azure Cost Management
- Look for unusual resource usage
- Might need to scale down or investigate

🚩 **Deployments start failing**
- Check if Azure credentials expired
- Verify GitHub secrets are still valid
- May need to regenerate service principal

🚩 **App becomes slow**
- Check if database needs optimization
- Consider scaling up App Service tier
- Review application performance metrics

🚩 **Can't access Azure Portal**
- Credentials may have expired
- Contact IT to reset/restore access
- Check if subscription is active

---

## Contact Information

**Previous Maintainer**: [Your Name]
- Email: [Your Company Email]
- Last day: [Date]
- Available for questions until: [Date + 2 weeks?]

**Escalation Points**:
- IT/DevOps Team: [Email]
- Azure Subscription Admin: [Name/Email]
- GitHub Org Admin: [Name/Email]

---

## Final Notes

### What's Automated
✅ Deployments (push to main)
✅ Docker image building
✅ Container registry management
✅ App restarts after config changes

### What's Manual
❌ Environment variable updates (use Azure Portal)
❌ Database migrations (run when needed)
❌ Scaling resources up/down (Azure Portal)
❌ Cost monitoring (review monthly)

### Resources for Learning
- **Azure Basics**: Microsoft Learn (free courses)
- **GitHub Actions**: GitHub Skills (free interactive tutorials)
- **Docker Concepts**: Don't need to know, but if curious: docker.com/get-started

---

## Success Criteria

**You're ready to take over when you can:**
- [ ] Deploy a code change successfully
- [ ] View and understand application logs
- [ ] Rollback a deployment
- [ ] Update an environment variable
- [ ] Explain deployment flow to someone else
- [ ] Find and fix a simple bug end-to-end
- [ ] Monitor application health
- [ ] Know who to contact for help

**You don't need to know:**
- ❌ Docker internals
- ❌ Azure CLI commands
- ❌ Container orchestration
- ❌ Complex DevOps patterns

**GitHub Actions does all the complex stuff for you!**

---

## Questions? Start Here

1. **How do I deploy?** → Push to main branch, that's it
2. **How do I see logs?** → Azure Portal → Log stream
3. **Something broke, how to rollback?** → Azure Portal → Deployment Center → Redeploy
4. **How to update config?** → Azure Portal → Configuration
5. **Cost too high?** → Azure Portal → Cost Management

**Most common answer: "Check Azure Portal"**

The Azure Portal web interface has everything you need. No command line required!

---

**Welcome to the team! You've got this! 🚀**
