# Authentication Guide

## Overview

JWT-based authentication with role-based access control (RBAC).

**Features:**
- ✅ Access tokens (15 minutes)
- ✅ Refresh tokens (7 days)
- ✅ Role-based authorization (ADMIN, ISP)
- ✅ Middleware-based protection
- ✅ Password hashing (bcrypt)

---

## Test Users

### Admin User
```
Email: admin@nettap.az
Password: admin123
Role: ADMIN
```

### ISP Users
```
Email: azertelecom@nettap.az
Password: isp123
Role: ISP
ISP ID: 770e8400-e29b-41d4-a716-446655440001 (AzerTelecom)

Email: baktelecom@nettap.az
Password: isp123
Role: ISP
ISP ID: 770e8400-e29b-41d4-a716-446655440002 (Baktelecom)
```

---

## Authentication Flow

### 1. Login

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@nettap.az",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "email": "admin@nettap.az",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### 2. Use Access Token

**Include in Authorization header:**
```bash
GET /api/admin/leads
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Refresh Token

**When access token expires (after 15 minutes):**
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new_access_token",
      "refreshToken": "new_refresh_token",
      "expiresIn": 900
    }
  }
}
```

---

## Protected Endpoints

### Admin Only

**Requires:** `Authorization: Bearer <token>` with `role: admin`

- `GET /api/admin/leads` - View all leads
- `POST /api/admin/assign-isp` - Assign lead to ISP

### Admin or ISP

**Requires:** `Authorization: Bearer <token>` with `role: admin` or `role: isp`

- `PATCH /api/admin/leads/:id` - Update lead status
  - Admin can update any lead
  - ISP can only update leads assigned to them

### ISP Only

**Requires:** `Authorization: Bearer <token>` with `role: isp` and valid `ispId`

- `GET /api/isp/leads` - View assigned leads (filtered by ISP ID from token)

### Public (No Auth)

- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/health` - Health check
- `GET /api/filters` - Available filters
- `GET /api/tariffs` - Search tariffs
- `POST /api/leads` - Create lead

---

## Testing Authentication

### Step 1: Login as Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nettap.az",
    "password": "admin123"
  }'
```

**Save the `accessToken` from response.**

### Step 2: Access Protected Endpoint

```bash
curl http://localhost:3000/api/admin/leads \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 3: Test ISP Access

```bash
# Login as ISP
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "azertelecom@nettap.az",
    "password": "isp123"
  }'

# Get ISP's leads (uses ispId from token)
curl http://localhost:3000/api/isp/leads \
  -H "Authorization: Bearer ISP_ACCESS_TOKEN"
```

### Step 4: Test Role-Based Access

```bash
# ISP trying to access admin endpoint (should fail)
curl http://localhost:3000/api/admin/leads \
  -H "Authorization: Bearer ISP_ACCESS_TOKEN"

# Expected: 403 Forbidden
```

---

## Error Responses

### 401 Unauthorized

**Missing token:**
```json
{
  "success": false,
  "error": {
    "message": "Missing authorization token",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

**Invalid credentials:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

**Expired token:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

### 403 Forbidden

**Insufficient permissions:**
```json
{
  "success": false,
  "error": {
    "message": "Insufficient permissions",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

**ISP accessing another ISP's resource:**
```json
{
  "success": false,
  "error": {
    "message": "You do not have permission to access this resource",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

---

## Token Payload

**Access token contains:**
```json
{
  "userId": "aa0e8400-e29b-41d4-a716-446655440001",
  "email": "admin@nettap.az",
  "role": "admin",
  "ispId": "770e8400-e29b-41d4-a716-446655440001",
  "iat": 1703500800,
  "exp": 1703501700
}
```

**Fields:**
- `userId` - User identifier
- `email` - User email
- `role` - User role (admin, isp, user)
- `ispId` - ISP identifier (only for ISP users)
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

---

## Security Best Practices

### Environment Variables

**Add to `.env`:**
```env
# JWT Secrets (change in production!)
API_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Admin API Key (for additional security)
ADMIN_API_KEY=your-admin-api-key
```

### Production Checklist

- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Store secrets in environment variables
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on login endpoint
- [ ] Add account lockout after failed attempts
- [ ] Log all authentication events
- [ ] Implement password complexity requirements
- [ ] Add email verification for new users
- [ ] Implement 2FA for admin accounts
- [ ] Set secure cookie flags for tokens (HttpOnly, Secure, SameSite)

---

## Middleware Usage

### Protect a Route

```typescript
import { requireAdmin } from '@/lib';

async function handler(request: AuthenticatedRequest) {
  // Access user from request.user
  const userId = request.user.userId;
  const role = request.user.role;
  
  // Your logic here
}

export const GET = requireAdmin(handler);
```

### Custom Middleware

```typescript
import { withAuth } from '@/lib';

async function handler(request: AuthenticatedRequest) {
  // Your logic
}

export const GET = withAuth(handler, {
  allowedRoles: [UserRole.ADMIN, UserRole.ISP],
  requireIspId: false
});
```

### Check Ownership

```typescript
import { checkIspOwnership, isAdmin } from '@/lib';

async function handler(request: AuthenticatedRequest) {
  const lead = await getLeadById(leadId);
  
  // Admin can access all, ISP can only access their leads
  if (!isAdmin(request) && lead.assignedIspId) {
    checkIspOwnership(request, lead.assignedIspId);
  }
  
  // Continue processing...
}
```

---

## Complete Example: ISP Workflow

### 1. ISP Logs In

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "azertelecom@nettap.az",
    "password": "isp123"
  }'
```

**Response includes:**
- User info (id, email, role, ispId)
- Access token (15 min)
- Refresh token (7 days)

### 2. ISP Views Assigned Leads

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:3000/api/isp/leads \
  -H "Authorization: Bearer $TOKEN"
```

**Returns only leads assigned to this ISP** (filtered by `ispId` from token).

### 3. ISP Updates Lead Status

```bash
LEAD_ID="990e8400-e29b-41d4-a716-446655440001"

curl -X PATCH http://localhost:3000/api/admin/leads/$LEAD_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "outcomeNotes": "Customer contacted, installation scheduled"
  }'
```

**ISP can only update leads assigned to them.**

### 4. Token Expires After 15 Minutes

```bash
# Use refresh token to get new access token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Architecture

```
Request
  ↓
Middleware (withAuth)
  ├─ Extract token from header
  ├─ Verify JWT signature
  ├─ Check role permissions
  ├─ Attach user to request
  ↓
Route Handler
  ├─ Access request.user
  ├─ Business logic
  ↓
Response
```

---

## Next Steps

- [ ] Add password reset flow
- [ ] Implement email verification
- [ ] Add 2FA for admins
- [ ] Implement session management
- [ ] Add rate limiting
- [ ] Log authentication events
- [ ] Add webhook for ISP notifications
