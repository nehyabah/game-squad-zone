# 🏈 SquadPot Database Backup & Restore Guide

## 🚨 Why Backup?

With the `--accept-data-loss` issue now **FIXED**, your data is protected from deployment wipes. However, backups are still essential for:
- **Data corruption protection**
- **Recovery from user errors**
- **Pre-migration safety**
- **Development testing**
- **Azure service outages**

---

## 📦 Prerequisites

Install PostgreSQL client tools to enable `pg_dump` and `psql` commands:

### Windows
```bash
# Download and install PostgreSQL from:
# https://www.postgresql.org/download/windows/
# OR use chocolatey:
choco install postgresql
```

### Mac
```bash
brew install postgresql
```

### Ubuntu/Linux
```bash
sudo apt-get install postgresql-client
```

---

## 🔧 Available Commands

### Create Backups
```bash
# Full backup (schema + data) - RECOMMENDED
npm run db:backup

# Schema only (structure without data)
npm run db:backup schema-only

# Data only (no table structure)
npm run db:backup data-only

# List all existing backups
npm run db:backup-list
```

### Restore Database
```bash
# Interactive restore (guided process)
npm run db:restore

# Restore specific backup file
npm run db:restore-file backups/backup-2025-01-15T10-30-00-000Z.sql

# Advanced restore options
npm run db:restore-file backups/backup.sql -- --drop --verbose
```

---

## 📋 Backup Types Explained

### 1. **Full Backup** (Default)
- ✅ Complete database structure
- ✅ All user data (picks, scores, users, squads)
- ✅ Best for disaster recovery
- 📁 Size: ~5-50 MB (depending on data)

### 2. **Schema-Only Backup**
- ✅ Table structures, indexes, constraints
- ❌ No user data
- 🎯 Use: Testing migrations, development setup
- 📁 Size: ~1-5 MB

### 3. **Data-Only Backup**
- ❌ No table structures
- ✅ All user data only
- 🎯 Use: Transferring data between identical schemas
- 📁 Size: ~2-20 MB

---

## 🎯 Recommended Backup Strategy

### **Before Major Changes**
```bash
# Always backup before:
npm run db:backup  # Before schema migrations
npm run db:backup  # Before major deployments
npm run db:backup  # Before data cleanup scripts
```

### **Regular Scheduled Backups**
```bash
# Weekly production backup (run on your local machine)
npm run db:backup

# Keep last 5 backups, delete older ones
npm run db:backup-list  # Check what you have
```

### **Pre-Development Safety**
```bash
# Before testing destructive operations:
npm run db:backup data-only  # Quick data backup
# ... test your changes ...
# Restore if needed: npm run db:restore
```

---

## 🛡️ Safety Features

### **Production Protection**
- Scripts detect production environment
- Extra confirmation prompts for destructive operations
- No accidental data loss from backup scripts

### **Backup Verification**
- File size checks after backup creation
- Content preview to verify backup integrity
- Connection testing before operations

### **Restore Safety**
- Interactive mode with clear warnings
- Step-by-step confirmation for dangerous operations
- Option to restore without dropping existing data

---

## 📁 Backup File Structure

Backups are stored in `backend/backups/` with timestamp naming:

```
backend/backups/
├── backup-2025-01-15T10-30-00-000Z.sql  # Full backup
├── backup-2025-01-14T15-45-30-000Z.sql  # Previous backup
└── backup-schema-2025-01-13T09-15-00-000Z.sql  # Schema-only
```

---

## 🚀 Quick Start Examples

### **Create Your First Backup**
```bash
cd backend
npm run db:backup
# ✅ Creates: backups/backup-2025-01-15T10-30-00-000Z.sql
```

### **Emergency Restore**
```bash
cd backend
npm run db:restore
# 📋 Shows list of available backups
# 🎯 Select backup to restore
# ⚠️  Confirms destructive operations
```

### **Copy Production to Development**
```bash
# 1. Backup production (with production DATABASE_URL)
npm run db:backup

# 2. Switch to development DATABASE_URL
# 3. Restore the backup
npm run db:restore
```

---

## 🔍 Troubleshooting

### **"pg_dump: command not found"**
Install PostgreSQL client tools (see Prerequisites above)

### **"password authentication failed"**
Check your `DATABASE_URL` in `.env` file

### **"could not connect to server"**
- Check network connection
- Verify Azure PostgreSQL firewall rules
- Confirm database server is running

### **"backup file is empty"**
- Check disk space
- Verify database connection
- Try schema-only backup first

### **"restore failed with errors"**
- Try `--verbose` flag to see detailed errors
- Use `--data-only` if schema conflicts exist
- Check PostgreSQL version compatibility

---

## 📈 Advanced Usage

### **Automated Backups with Cron**
```bash
# Add to crontab for daily backups at 2 AM:
0 2 * * * cd /path/to/project/backend && npm run db:backup

# Weekly cleanup (keep only recent backups):
0 3 * * 0 find /path/to/project/backend/backups -name "*.sql" -mtime +30 -delete
```

### **Backup to Cloud Storage**
```bash
# After creating backup, upload to Azure/AWS/Google Cloud
npm run db:backup
az storage blob upload --file backups/backup-latest.sql --container backups
```

### **Selective Table Backup**
```bash
# For custom table-specific backups, use pg_dump directly:
pg_dump --table=PickSet --table=Pick --data-only \
  --host=squadpot-public-db.postgres.database.azure.com \
  --username=bycocjkgpo --dbname=postgres \
  --file=picks-only-backup.sql
```

---

## 🎯 Best Practices

1. **Backup before deployments** - Always create a backup before major changes
2. **Test your backups** - Regularly test restore procedures on development
3. **Keep multiple versions** - Don't rely on just one backup file
4. **Store offsite** - Keep backups outside your main server
5. **Document your process** - Keep notes on when/why backups were created
6. **Monitor backup sizes** - Unusually large/small backups may indicate issues

---

## 🆘 Emergency Contact

If you need help with database recovery:
1. **Don't panic** - The data is probably recoverable
2. **Stop all write operations** to prevent further data loss
3. **Check available backups**: `npm run db:backup-list`
4. **Test restore on a copy** before touching production
5. **Document what happened** for future prevention

Your Azure PostgreSQL database: `squadpot-public-db.postgres.database.azure.com`
Current database: `postgres`
User: `bycocjkgpo`

---

**Remember: Backups are only useful if you test them! 🧪**