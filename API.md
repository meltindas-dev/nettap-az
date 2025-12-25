# NetTap API Documentation

## Overview

Backend API for internet tariff comparison platform built with Next.js 14+ App Router.

**Authentication:** JWT-based with role-based access control (RBAC)

## Base URL

```
http://localhost:3000/api
```

## Architecture

```
Controller (API Routes) → Service (Business Logic) → Repository (Data Access)
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**See [AUTH.md](./AUTH.md) for complete authentication guide.**

**Test Credentials:**
- Admin: `admin@nettap.az` / `admin123`
- ISP: `azertelecom@nettap.az` / `isp123`

## Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "admin@nettap.az",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@nettap.az",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresIn": 900
    }
  }
}
```

---

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new_token...",
      "refreshToken": "new_refresh...",
      "expiresIn": 900
    }
  }
}
```

---

### Public Endpoints

#### GET /api/health
Health check endpoint.

**Response:**
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

#### GET /api/filters
Get all available filter options.

**Response:**
```json
{
  "success": true,
  "data": {
    "cities": [...],
    "districts": [...],
    "technologies": ["fiber", "adsl", "vdsl", "wireless", "4.5g"],
    "speedRanges": [...],
    "priceRanges": [...]
  }
}
```

---

#### GET /api/tariffs
Search and filter internet tariffs.

**Query Parameters:**
- `cityId` (string, UUID) - Filter by city
- `districtIds` (string, comma-separated) - Filter by districts
- `technologies` (string, comma-separated) - Filter by technology types
- `minSpeedMbps` (number) - Minimum speed
- `maxSpeedMbps` (number) - Maximum speed
- `minPriceMonthly` (number) - Minimum monthly price
- `maxPriceMonthly` (number) - Maximum monthly price
- `maxContractLength` (number) - Maximum contract length in months
- `freeModem` (boolean) - Filter for free modem campaign
- `freeInstallation` (boolean) - Filter for free installation
- `noContract` (boolean) - Filter for no-contract offers
- `sortBy` (string) - `price` | `speed` | `speed_price_ratio` | `priority`
- `sortOrder` (string) - `asc` | `desc`

**Example:**
```
GET /api/tariffs?cityId=550e8400-e29b-41d4-a716-446655440001&minSpeedMbps=50&maxPriceMonthly=30&freeModem=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "ispId": "770e8400-e29b-41d4-a716-446655440001",
      "name": "Fiber Premium 100",
      "technology": "fiber",
      "speedMbps": 100,
      "priceMonthly": 25.00,
      "campaigns": {
        "freeModem": true,
        "freeInstallation": true
      },
      "isp": {
        "name": "AzerTelecom",
        "logo": "/logos/azertelecom.png"
      },
      "speedPriceRatio": 4.0,
      "campaignScore": 40
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

#### POST /api/leads
Create a new lead.

**Request Body:**
```json
{
  "fullName": "Aysel Məmmədova",
  "phone": "+994501234567",
  "email": "aysel@example.com",
  "cityId": "550e8400-e29b-41d4-a716-446655440001",
  "districtId": "660e8400-e29b-41d4-a716-446655440001",
  "address": "Nizami küç. 123",
  "tariffId": "880e8400-e29b-41d4-a716-446655440001",
  "source": "comparison"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "status": "new",
    "fullName": "Aysel Məmmədova",
    "phone": "+994501234567",
    "tariffSnapshot": {
      "tariffName": "Fiber Premium 100",
      "ispName": "AzerTelecom",
      "speedMbps": 100,
      "priceMonthly": 25.00
    },
    "createdAt": "2025-12-25T10:00:00.000Z"
  }
}
```

---

### Admin Endpoints

**Authentication Required:** `Authorization: Bearer <token>` with `role: admin`

#### GET /api/admin/leads
Get all leads (admin only).

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

---

#### PATCH /api/admin/leads/:id
Update lead status.

**Authentication Required:** `Authorization: Bearer <token>` with `role: admin` or `role: isp`
- Admin can update any lead
- ISP can only update leads assigned to them

**Request Body:**
```json
{
  "status": "contacted",
  "notes": "Called customer, interested in fiber",
  "outcomeNotes": "Scheduled installation for next week"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "status": "contacted",
    "notes": "Called customer, interested in fiber",
    "updatedAt": "2025-12-25T11:00:00.000Z"
  }
}
```

---

#### POST /api/admin/assign-isp
Assign a lead to an ISP.

**Authentication Required:** `Authorization: Bearer <token>` with `role: admin`

**Request Body:**
```json
{
  "leadId": "990e8400-e29b-41d4-a716-446655440001",
  "ispId": "770e8400-e29b-41d4-a716-446655440001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "status": "assigned_to_isp",
    "assignedIspId": "770e8400-e29b-41d4-a716-446655440001",
    "assignedAt": "2025-12-25T11:30:00.000Z"
  }
}
```

---

### ISP Endpoints

**Authentication Required:** `Authorization: Bearer <token>` with `role: isp`

#### GET /api/isp/leads
Get leads assigned to ISP.

**Headers:**
- `Authorization: Bearer <access_token>` (ISP ID extracted from token)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 10
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {}
  }
}
```

## Lead Status Lifecycle

```
NEW → CONTACTED → QUALIFIED → ASSIGNED_TO_ISP → IN_PROGRESS → CONVERTED
                     ↓              ↓                 ↓            ↓
                 REJECTED      CANCELLED        CANCELLED    REJECTED
```

## Data Models

### ISP
- id, name, logo, contactEmail, contactPhone, priorityScore

### Tariff
- id, ispId, name, technology, speedMbps, priceMonthly, contractLengthMonths
- campaigns: { freeModem, freeInstallation, discountPercentage, noContract }
- availableDistrictIds

### Lead
- id, status, source, fullName, phone, email
- cityId, districtId, address
- tariffSnapshot, assignedIspId, notes

## Testing with cURL

### 1. Login
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nettap.az",
    "password": "admin123"
  }'

# Save the accessToken from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Use Protected Endpoints

```bash
# Get filters (public, no auth)
curl http://localhost:3000/api/filters

# Search tariffs (public)
curl "http://localhost:3000/api/tariffs?minSpeedMbps=50&maxPriceMonthly=30"

# Create lead (public)
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phone": "+994501234567",
    "cityId": "550e8400-e29b-41d4-a716-446655440001",
    "districtId": "660e8400-e29b-41d4-a716-446655440001",
    "tariffId": "880e8400-e29b-41d4-a716-446655440001"
  }'

# Get all leads (admin only - requires auth)
curl http://localhost:3000/api/admin/leads \
  -H "Authorization: Bearer $TOKEN"

# Assign lead to ISP (admin only)
curl -X POST http://localhost:3000/api/admin/assign-isp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "LEAD_UUID",
    "ispId": "770e8400-e29b-41d4-a716-446655440001"
  }'
```

### 3. ISP Access

```bash
# Login as ISP
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "azertelecom@nettap.az",
    "password": "isp123"
  }'

ISP_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get ISP's assigned leads
curl http://localhost:3000/api/isp/leads \
  -H "Authorization: Bearer $ISP_TOKEN"
```
