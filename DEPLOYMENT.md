# Production Deployment Guide

## 🚀 Quick Start

Choose your deployment platform:
- **Vercel** - Best for serverless/edge deployment (Google Sheets backend)
- **Fly.io** - Best for PostgreSQL with global edge deployment
- **Render** - Best for simple PostgreSQL setup with auto-scaling
- **Docker** - Self-hosted deployment

---

## 📋 Pre-Deployment Checklist

### Required Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` - Strong random 256-bit string
- [ ] `DATABASE_TYPE` - Choose: `postgres`, `sheets`, or `memory`
- [ ] Database credentials (PostgreSQL or Google Sheets)
- [ ] `LOG_LEVEL=info` (or `warn` for less verbose)

### Security Checklist
- [ ] JWT secret is cryptographically random (use: `openssl rand -base64 64`)
- [ ] PostgreSQL password is strong (20+ characters)
- [ ] All secrets stored in platform secret manager (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] HTTPS/TLS enabled on production domain

### Database Setup
- [ ] PostgreSQL: Run `database/schema.sql` to initialize tables
- [ ] Google Sheets: Create spreadsheet with required sheets
- [ ] Database migrations complete
- [ ] Seed data loaded (if needed)

---

## 🐳 Docker Deployment

### Local Docker Build
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f app

# Health check
curl http://localhost:3000/api/health

# Stop services
docker-compose down
```

### Production Docker
```bash
# Build production image
docker build -t nettap-az:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_TYPE=postgres \
  -e POSTGRES_HOST=your-db-host \
  -e POSTGRES_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  --name nettap-app \
  nettap-az:latest

# Check health
docker exec nettap-app wget -qO- http://localhost:3000/api/health
```

---

## ☁️ Vercel Deployment

**Best for:** Serverless deployment with Google Sheets backend

### Setup Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Configure Environment Variables**
```bash
# Set production environment variables
vercel env add NODE_ENV production
vercel env add DATABASE_TYPE sheets
vercel env add JWT_SECRET <your-secret>
vercel env add GOOGLE_SHEETS_ID <sheet-id>
vercel env add GOOGLE_SHEETS_CREDENTIALS <json-credentials>
```

4. **Deploy**
```bash
# Deploy to production
vercel --prod

# Or link to existing project
vercel link
vercel --prod
```

### Google Sheets Setup for Vercel

1. Create Google Cloud Project
2. Enable Google Sheets API
3. Create Service Account
4. Download credentials JSON
5. Share your Google Sheet with service account email
6. Add credentials as environment variable:
```bash
vercel env add GOOGLE_SHEETS_CREDENTIALS "$(cat service-account.json)"
```

### Vercel Environment Variables
```
NODE_ENV=production
DATABASE_TYPE=sheets
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
JWT_SECRET=your_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
LOG_LEVEL=info
```

---

## 🛫 Fly.io Deployment

**Best for:** PostgreSQL with global edge deployment

### Setup Steps

1. **Install Fly CLI**
```bash
# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux/Mac
curl -L https://fly.io/install.sh | sh
```

2. **Login and Create App**
```bash
fly auth login
fly apps create nettap-az
```

3. **Create PostgreSQL Database**
```bash
fly postgres create --name nettap-postgres --region iad
fly postgres attach nettap-postgres -a nettap-az
```

4. **Set Secrets**
```bash
fly secrets set JWT_SECRET=$(openssl rand -base64 64) -a nettap-az
fly secrets set DATABASE_TYPE=postgres -a nettap-az
fly secrets set LOG_LEVEL=info -a nettap-az
```

5. **Initialize Database**
```bash
# Connect to PostgreSQL
fly postgres connect -a nettap-postgres

# Run schema
\i database/schema.sql
\q
```

6. **Deploy**
```bash
fly deploy
```

7. **Verify Deployment**
```bash
fly status
fly logs
fly open /api/health
```

### Fly.io Configuration (`fly.toml`)
Already created in project root. Update app name and region as needed.

---

## 🎨 Render Deployment

**Best for:** Simple setup with managed PostgreSQL

### Setup Steps

1. **Create Render Account** at https://render.com

2. **Deploy via Blueprint** (Recommended)
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select `render.yaml`
   - Click "Apply"
   - Render will create both web service and PostgreSQL automatically

3. **Manual Setup** (Alternative)

   a. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `nettap-postgres`
   - Choose plan (Free or Starter)
   - Create Database
   - Copy connection details

   b. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect repository
   - Configure:
     - Name: `nettap-api`
     - Environment: `Docker`
     - Region: Frankfurt (or nearest)
     - Instance Type: Starter
     - Build Command: (auto-detected from Dockerfile)
     - Start Command: (auto-detected)

   c. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_TYPE=postgres
   POSTGRES_HOST=<from-database>
   POSTGRES_PORT=5432
   POSTGRES_DB=<from-database>
   POSTGRES_USER=<from-database>
   POSTGRES_PASSWORD=<from-database>
   JWT_SECRET=<generate-random>
   LOG_LEVEL=info
   ```

4. **Initialize Database**
   - Connect to PostgreSQL using provided URL
   - Run `database/schema.sql`

5. **Deploy**
   - Render auto-deploys on every push to main branch
   - Or click "Manual Deploy" in dashboard

6. **Verify**
   - Check https://your-app.onrender.com/api/health

---

## 🔐 Secrets Management

### Generate Strong Secrets

```bash
# JWT Secret (256-bit)
openssl rand -base64 64

# PostgreSQL Password
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Platform Secret Managers

**Vercel:**
```bash
vercel env add JWT_SECRET
# Paste secret when prompted
```

**Fly.io:**
```bash
fly secrets set JWT_SECRET="your-secret"
```

**Render:**
- Dashboard → Service → Environment → Add Secret File
- Or use Environment Variables section

**Docker:**
- Use Docker secrets: `docker secret create jwt_secret secret.txt`
- Or mount environment file: `-v $(pwd)/.env.production:/app/.env:ro`

---

## 📊 Post-Deployment Verification

### Health Check
```bash
curl https://your-domain.com/api/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-26T...",
    "version": "1.0.0",
    "environment": "production",
    "database": {
      "type": "postgres",
      "status": "healthy"
    },
    "config": {
      "valid": true,
      "errors": []
    }
  }
}
```

### API Endpoints Test
```bash
# Get filters
curl https://your-domain.com/api/filters

# Search tariffs
curl https://your-domain.com/api/tariffs

# Login (admin)
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Monitoring Setup
```bash
# Vercel: Built-in analytics
# Fly.io: fly logs --app nettap-az
# Render: Built-in logs and metrics

# External monitoring (recommended):
# - Uptime: UptimeRobot, Pingdom
# - APM: Datadog, New Relic
# - Errors: Sentry, Rollbar
```

---

## 🔄 CI/CD Setup

### GitHub Actions (Vercel)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Fly.io Auto-Deploy

Already configured in `fly.toml`. Push to main branch triggers deployment.

### Render Auto-Deploy

Enabled by default. Every push to main branch triggers deployment.

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql "postgresql://user:pass@host:5432/nettap" -c "SELECT 1"

# Check environment variables
env | grep POSTGRES

# Fly.io: Check database connection
fly postgres db list -a nettap-postgres
```

### JWT Authentication Errors
- Verify `JWT_SECRET` is set
- Check token expiration times
- Ensure secret is not default value

### High Memory Usage
- Set `LOG_LEVEL=warn` to reduce logging
- Enable Next.js output file tracing
- Increase container memory limits

### Slow Response Times
- Enable Next.js caching
- Add Redis for session storage
- Use CDN for static assets
- Enable database connection pooling

---

## 📈 Scaling Recommendations

### Horizontal Scaling
- **Vercel:** Auto-scales automatically
- **Fly.io:** Increase `min_machines_running` in `fly.toml`
- **Render:** Upgrade plan and enable auto-scaling
- **Docker:** Use Kubernetes or Docker Swarm

### Database Scaling
- Enable connection pooling (PgBouncer)
- Add read replicas for heavy read workloads
- Consider managed database services (AWS RDS, Google Cloud SQL)

### Performance Optimization
- Enable Next.js ISR (Incremental Static Regeneration)
- Add Redis for caching
- Use CDN (Cloudflare, AWS CloudFront)
- Optimize database queries with indexes

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use platform secret managers
   - Rotate secrets regularly

2. **Database Security**
   - Use connection pooling
   - Enable SSL/TLS for database connections
   - Restrict database access by IP

3. **API Security**
   - Rate limiting (use Vercel Edge Middleware or nginx)
   - Input validation on all endpoints
   - CORS configuration
   - CSP headers

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor failed login attempts
   - Track API usage and anomalies

---

## 📞 Support

- **Documentation:** See project README.md
- **API Reference:** See API.md
- **Issues:** GitHub Issues
- **Health Check:** https://your-domain.com/api/health
