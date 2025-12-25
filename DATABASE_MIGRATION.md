# Database Migration Guide

## Overview
NetTap supports three database backends:
- **In-Memory** (default) - For development and testing
- **PostgreSQL** - Production-grade relational database
- **Google Sheets** - Spreadsheet-based storage

All backends implement the same repository interfaces, allowing seamless switching via environment variables.

---

## 1. PostgreSQL Setup

### Installation

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Database Creation

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE nettap;
CREATE USER nettap_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nettap TO nettap_user;

# Exit psql
\q
```

### Run Migration

```bash
# From project root
psql -U nettap_user -d nettap -f database/schema.sql
```

### Configure Environment

Create `.env.local`:
```env
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nettap
POSTGRES_USER=nettap_user
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=generate-a-secure-random-string-here
```

### Verify Connection

```bash
npm run dev
# Check logs for: "✅ PostgreSQL repositories initialized"
```

---

## 2. Google Sheets Setup

### Create Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "NetTap Database"
3. Create the following sheets with exact column headers:

**Users Sheet:**
| id | email | password_hash | role | isp_id | is_active | created_at | updated_at |

**Leads Sheet:**
| id | status | source | full_name | phone | email | city_id | district_id | address | tariff_snapshot | assigned_isp_id | assigned_at | notes | outcome_notes | created_at | updated_at | converted_at |

**Tariffs Sheet:**
| id | isp_id | name | description | technology | speed_mbps | upload_speed_mbps | price_monthly | contract_length_months | data_limit_gb | free_modem | free_installation | available_district_ids | is_active | created_at | updated_at |

### Get Spreadsheet ID

From the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### Option A: Service Account (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Create credentials → Service Account
5. Download JSON key file
6. Share your spreadsheet with the service account email (e.g., `nettap@PROJECT_ID.iam.gserviceaccount.com`)

**Configure .env.local:**
```env
DATABASE_TYPE=sheets
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"..."}'
```

### Option B: API Key (Read-Only)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Sheets API
3. Create credentials → API Key
4. Make spreadsheet publicly readable

**Configure .env.local:**
```env
DATABASE_TYPE=sheets
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_API_KEY=your_api_key_here
```

---

## 3. In-Memory (Default)

No setup required. Uses mock data from repository files.

**Configure .env.local:**
```env
DATABASE_TYPE=memory
JWT_SECRET=dev-secret-only
```

---

## Switching Between Databases

Simply change `DATABASE_TYPE` in your `.env` file and restart the server:

```bash
# Use PostgreSQL
DATABASE_TYPE=postgres npm run dev

# Use Google Sheets
DATABASE_TYPE=sheets npm run dev

# Use In-Memory
DATABASE_TYPE=memory npm run dev
```

---

## Data Migration

### Export from In-Memory to PostgreSQL

```bash
# TODO: Add migration script
npm run migrate:export-to-postgres
```

### Export from PostgreSQL to Sheets

```bash
# TODO: Add migration script
npm run migrate:postgres-to-sheets
```

---

## Troubleshooting

### PostgreSQL Connection Errors

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Test connection
psql -U nettap_user -d nettap -c "SELECT 1;"
```

### Google Sheets API Errors

- **403 Forbidden**: Check spreadsheet sharing settings
- **400 Bad Request**: Verify column headers match exactly
- **Rate Limit**: Sheets API has 100 requests/100 seconds/user limit

### Type Errors

If you see TypeScript errors after switching databases, restart TypeScript server:
- VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Use PostgreSQL or managed database service
- [ ] Enable SSL for database connections
- [ ] Set up database backups
- [ ] Configure connection pooling limits
- [ ] Monitor database performance
- [ ] Implement rate limiting for API endpoints
