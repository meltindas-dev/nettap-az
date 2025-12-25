# Project: Internet Tariff Comparison Platform (NetTap)

## Tech Stack
- TypeScript (strict mode)
- Next.js 14+ App Router
- Repository pattern (DB-agnostic)
- PostgreSQL OR Google Sheets
- Backend-first architecture

## Architecture Principles
- Clean separation: Controller → Service → Repository
- Domain-driven design
- Type-safe models
- Production-grade error handling
- Scalable to 100k+ leads/month

## Project Status
- [x] Workspace initialized
- [x] Domain models defined
- [x] Repository layer implemented (in-memory with mock data)
- [x] Service layer implemented
- [x] API routes created (7 endpoints)
- [x] Authentication & authorization (JWT with RBAC)
- [ ] Database migration (PostgreSQL/Sheets)
- [ ] Testing setup complete
- [ ] SMS/Email integration
- [ ] Production deployment

## API Endpoints
- GET /api/health - Health check
- POST /api/auth/login - Login (returns JWT)
- POST /api/auth/refresh - Refresh token
- GET /api/filters - Available filter options
- GET /api/tariffs - Search tariffs with filters
- POST /api/leads - Create new lead
- GET /api/admin/leads - Get all leads (admin) 🔒
- PATCH /api/admin/leads/:id - Update lead status (admin/ISP) 🔒
- POST /api/admin/assign-isp - Assign lead to ISP (admin) 🔒
- GET /api/isp/leads - Get ISP's assigned leads (ISP) 🔒

🔒 = Requires authentication
