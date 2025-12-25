# Quick Start Guide

## Start Development Server

```bash
npm run dev
```

Server will be available at: http://localhost:3000

---

## Test the API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-25T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

---

### 2. Get Available Filters
```bash
curl http://localhost:3000/api/filters
```

**You'll receive:**
- List of cities (Bakı, Gəncə, Sumqayıt)
- Districts for each city
- Available technologies
- Speed and price ranges

---

### 3. Search for Tariffs

**Example 1: Find fiber tariffs in Bakı**
```bash
curl "http://localhost:3000/api/tariffs?technologies=fiber&districtIds=660e8400-e29b-41d4-a716-446655440001"
```

**Example 2: Find tariffs under 20 AZN with free modem**
```bash
curl "http://localhost:3000/api/tariffs?maxPriceMonthly=20&freeModem=true"
```

**Example 3: Find fastest tariffs, sorted by speed**
```bash
curl "http://localhost:3000/api/tariffs?minSpeedMbps=50&sortBy=speed&sortOrder=desc"
```

---

### 4. Create a Lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Aysel Məmmədova",
    "phone": "+994501234567",
    "email": "aysel@example.com",
    "cityId": "550e8400-e29b-41d4-a716-446655440001",
    "districtId": "660e8400-e29b-41d4-a716-446655440001",
    "tariffId": "880e8400-e29b-41d4-a716-446655440001"
  }'
```

**Save the returned `leadId` for next steps!**

---

### 5. View All Leads (Admin)

```bash
curl "http://localhost:3000/api/admin/leads?page=1&limit=10"
```

---

### 6. Update Lead Status

Replace `LEAD_ID` with the actual ID from step 4:

```bash
curl -X PATCH http://localhost:3000/api/admin/leads/LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contacted",
    "notes": "Customer is interested, will call back tomorrow"
  }'
```

---

### 7. Assign Lead to ISP

```bash
curl -X POST http://localhost:3000/api/admin/assign-isp \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "LEAD_ID",
    "ispId": "770e8400-e29b-41d4-a716-446655440001"
  }'
```

---

### 8. View ISP's Assigned Leads

```bash
curl http://localhost:3000/api/isp/leads \
  -H "X-ISP-ID: 770e8400-e29b-41d4-a716-446655440001"
```

---

## Test Data Reference

### City IDs
- **Bakı**: `550e8400-e29b-41d4-a716-446655440001`
- **Gəncə**: `550e8400-e29b-41d4-a716-446655440002`
- **Sumqayıt**: `550e8400-e29b-41d4-a716-446655440003`

### District IDs (Bakı)
- **Nəsimi**: `660e8400-e29b-41d4-a716-446655440001`
- **Yasamal**: `660e8400-e29b-41d4-a716-446655440002`
- **Nərimanov**: `660e8400-e29b-41d4-a716-446655440003`
- **Sabunçu**: `660e8400-e29b-41d4-a716-446655440004`

### ISP IDs
- **AzerTelecom**: `770e8400-e29b-41d4-a716-446655440001`
- **Baktelecom**: `770e8400-e29b-41d4-a716-446655440002`
- **Naxtel**: `770e8400-e29b-41d4-a716-446655440003`

### Tariff IDs
- **Fiber Premium 100**: `880e8400-e29b-41d4-a716-446655440001`
- **Fiber Basic 50**: `880e8400-e29b-41d4-a716-446655440002`
- **VDSL 30**: `880e8400-e29b-41d4-a716-446655440003`
- **4.5G Unlimited**: `880e8400-e29b-41d4-a716-446655440004`

---

## Common Workflows

### User Selects Tariff → Lead Created
1. User selects filters on frontend
2. `GET /api/tariffs` returns matching tariffs
3. User clicks "Apply" on a tariff
4. `POST /api/leads` creates lead with tariff snapshot
5. Lead status = "new"

### Admin Processes Lead
1. `GET /api/admin/leads` to see all leads
2. Admin calls customer
3. `PATCH /api/admin/leads/:id` to update status to "contacted"
4. If qualified, `POST /api/admin/assign-isp` to assign to ISP

### ISP Converts Lead
1. `GET /api/isp/leads` to see assigned leads
2. ISP contacts customer
3. `PATCH /api/admin/leads/:id` to update status to "in_progress"
4. After installation: status → "converted"

---

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**For development (in-memory):**
```env
DATABASE_TYPE=memory
NODE_ENV=development
```

**For PostgreSQL:**
```env
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nettap
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

---

## Development Tips

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build Production
```bash
npm run build
npm start
```

---

## Next Steps

1. **Add Authentication**
   - Implement JWT middleware in `src/lib/auth.ts`
   - Protect admin routes
   - Add ISP role validation

2. **Connect Database**
   - Create PostgreSQL schema
   - Implement Postgres repositories
   - Run migrations

3. **Add Testing**
   - Unit tests for services
   - Integration tests for APIs
   - E2E workflow tests

4. **Integrate SMS/Email**
   - Lead notification system
   - Status update notifications
   - Welcome emails

---

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### TypeScript errors
```bash
npm run type-check
```

### Module not found
```bash
rm -rf node_modules
npm install
```

---

## Resources

- **API Documentation**: [API.md](./API.md)
- **Implementation Details**: [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- **Project Overview**: [README.md](./README.md)

---

**Ready to build the comparison platform! 🚀**
