# NetTap - Internet Tariff Comparison Platform

Backend-first platform for comparing ISP internet tariffs across Azerbaijan.

## Tech Stack

- **TypeScript** (strict mode)
- **Next.js 14+** App Router  
- **Repository Pattern** (DB-agnostic)
- **Multi-Database Support**: PostgreSQL | Google Sheets | In-Memory

## Architecture

```
src/
├── domain/              # Domain models and interfaces
├── repositories/        # Data access layer (3 backends)
│   ├── postgres/        # PostgreSQL implementation
│   ├── sheets/          # Google Sheets implementation
│   └── *.repository.ts  # In-memory implementation
├── services/            # Business logic layer
├── lib/                 # Utilities, config, logging
└── app/api/             # Next.js API routes (controllers)
```

**Clean 3-Layer Architecture:**
```
API Routes → Services → Repositories → Database
```

Switch databases via environment variable - zero code changes required!

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit DATABASE_TYPE: 'memory' | 'postgres' | 'sheets'
   ```

3. **Run development server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

4. **Type check:**
   ```bash
   npm run type-check
   ```

## Database Options

### 🚀 In-Memory (Default)
Perfect for development and testing. No setup required!
```bash
DATABASE_TYPE=memory npm run dev
```

### 🐘 PostgreSQL (Production)
Scalable, production-ready relational database.
```bash
# Setup database
psql -U postgres -d nettap -f database/schema.sql

# Configure .env.local
DATABASE_TYPE=postgres
POSTGRES_PASSWORD=your_password
JWT_SECRET=your_secret

npm run dev
```

### 📊 Google Sheets (Lightweight)
Spreadsheet-based storage for quick prototyping.
```bash
# Configure .env.local
DATABASE_TYPE=sheets
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS='{...service_account_json...}'

npm run dev
```

See [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) for detailed setup instructions.

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/filters` - Get available filter options (cities, districts, technologies)
- `GET /api/tariffs?districtId=...&technology=...` - Search tariffs with filters
- `POST /api/leads` - Create new lead from tariff comparison

### Authentication
- `POST /api/auth/login` - Login (returns JWT access + refresh tokens)
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints (Admin)
- `GET /api/admin/leads` - Get all leads
- `PATCH /api/admin/leads/:id` - Update lead status
- `POST /api/admin/assign-isp` - Assign lead to ISP

### Protected Endpoints (ISP)
- `GET /api/isp/leads` - Get assigned leads for ISP

See [API.md](API.md) for full API documentation.
- `GET /api/admin/leads` - Get all leads (admin)
- `PATCH /api/admin/leads/:id` - Update lead status (admin)
- `POST /api/admin/assign-isp` - Assign lead to ISP (admin)

## Testing

- **All tests:** `npm test` (45 tests passing)
- **Watch mode:** `npm run test:watch`
- **Coverage:** `npm run test:coverage`
- **Type check:** `npm run type-check`

## Production Deployment

### Pre-Deployment Checklist
```bash
# Run all production checks
npm run prod:check

# Generate secure secrets
node scripts/generate-secrets.js

# Validate environment
npm run validate:env
```

### Deployment Platforms

**Vercel** (Serverless + Google Sheets)
```bash
vercel --prod
```

**Fly.io** (PostgreSQL + Edge)
```bash
fly deploy
```

**Render** (Managed PostgreSQL)
```bash
# Deploy via Blueprint (render.yaml)
```

**Docker** (Self-hosted)
```bash
docker-compose up -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide and [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for pre-deployment verification.

### Environment Variables

Production requires:
- `NODE_ENV=production`
- `JWT_SECRET` (generate with: `openssl rand -base64 64`)
- `DATABASE_TYPE` (postgres/sheets/memory)
- Database credentials (PostgreSQL or Google Sheets)

See [.env.production.example](.env.production.example) for full list.

## Project Status

✅ **Completed:**
- Domain models and repository pattern
- Multi-database support (PostgreSQL, Sheets, Memory)
- JWT authentication with RBAC
- 7 API endpoints with comprehensive tests
- SMS/Email notification system
- Production-ready deployment configs

📋 **Documentation:**
- [API.md](API.md) - Complete API reference
- [AUTH.md](AUTH.md) - Authentication guide
- [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) - Database setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Pre-deployment checklist

## License

Private project - All rights reserved
