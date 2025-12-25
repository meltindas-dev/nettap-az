# Production Deployment Checklist

Use this checklist before deploying to production.

## 🔧 Pre-Deployment

### Environment Configuration
- [ ] `.env.production` file created with all required variables
- [ ] `NODE_ENV` set to `production`
- [ ] `DATABASE_TYPE` configured (`postgres`, `sheets`, or `memory`)
- [ ] `LOG_LEVEL` set to `info` or `warn`
- [ ] `PORT` configured (default: 3000)

### Security
- [ ] `JWT_SECRET` generated with `openssl rand -base64 64`
- [ ] `JWT_SECRET` is NOT the default value
- [ ] PostgreSQL password is strong (20+ characters)
- [ ] All secrets stored in platform secret manager (not committed to Git)
- [ ] `.env` files are in `.gitignore`
- [ ] Reviewed all environment variables for sensitive data

### Database
- [ ] Database server is accessible from deployment platform
- [ ] `database/schema.sql` executed successfully
- [ ] Database user has appropriate permissions
- [ ] Database connection tested locally
- [ ] Database backups configured
- [ ] SSL/TLS enabled for database connections (production)

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] TypeScript compilation successful: `npm run type-check`
- [ ] No ESLint errors: `npm run lint`
- [ ] Code reviewed and approved
- [ ] Secrets removed from code (no hardcoded passwords/keys)

### Dependencies
- [ ] All dependencies up to date
- [ ] No known security vulnerabilities: `npm audit`
- [ ] Production dependencies only in `dependencies` (not `devDependencies`)
- [ ] Lock file (`package-lock.json`) committed

---

## 🚀 Deployment

### Platform Setup
- [ ] Deployment platform account created (Vercel/Fly.io/Render)
- [ ] Repository connected to deployment platform
- [ ] Domain configured (if using custom domain)
- [ ] SSL/TLS certificate configured
- [ ] Environment variables set in platform dashboard

### Build & Deploy
- [ ] Build successful locally: `npm run build`
- [ ] Docker image builds successfully (if using Docker)
- [ ] Deployment configuration file reviewed (`vercel.json`/`fly.toml`/`render.yaml`)
- [ ] First deployment completed successfully
- [ ] Deployment logs checked for errors

### Health Checks
- [ ] Health endpoint accessible: `https://your-domain.com/api/health`
- [ ] Health endpoint returns `"status": "healthy"`
- [ ] Database status shows `"status": "healthy"`
- [ ] Config validation shows `"valid": true`
- [ ] No errors in `config.errors` array

---

## ✅ Post-Deployment Verification

### API Functionality
- [ ] GET `/api/health` returns 200 OK
- [ ] GET `/api/filters` returns filter options
- [ ] GET `/api/tariffs` returns tariff list
- [ ] POST `/api/auth/login` authenticates successfully
- [ ] POST `/api/leads` creates lead successfully
- [ ] GET `/api/admin/leads` requires authentication (returns 401 without token)
- [ ] PATCH `/api/admin/leads/:id` requires admin role (returns 403 for ISP role)

### Security Testing
- [ ] Unauthenticated requests to protected endpoints return 401
- [ ] Unauthorized requests to admin endpoints return 403
- [ ] JWT tokens expire correctly
- [ ] Refresh token rotation works
- [ ] Invalid JWT tokens are rejected
- [ ] SQL injection protection tested
- [ ] XSS protection tested
- [ ] CORS headers configured correctly

### Performance
- [ ] Health endpoint responds in < 500ms
- [ ] API endpoints respond in < 2s (cold start)
- [ ] Database queries optimized (no N+1 queries)
- [ ] Connection pooling enabled
- [ ] Static assets cached properly

### Monitoring
- [ ] Platform monitoring dashboard reviewed
- [ ] Log aggregation working
- [ ] Error tracking configured (Sentry, optional)
- [ ] Uptime monitoring configured (UptimeRobot, optional)
- [ ] Performance monitoring configured (optional)

---

## 📊 Production Readiness

### Documentation
- [ ] README.md updated with deployment info
- [ ] API.md reviewed and accurate
- [ ] DEPLOYMENT.md reviewed
- [ ] Environment variables documented in `.env.example`
- [ ] Deployment runbook created

### Backup & Recovery
- [ ] Database backup strategy defined
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure documented

### Team Readiness
- [ ] Team trained on deployment process
- [ ] Access credentials distributed securely
- [ ] On-call rotation defined (if applicable)
- [ ] Incident response plan created
- [ ] Communication channels established

---

## 🔄 Ongoing Maintenance

### Regular Tasks
- [ ] Monitor application health daily
- [ ] Review logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Test backups quarterly
- [ ] Review and update documentation as needed

### Incident Response
- [ ] Incident escalation path defined
- [ ] Emergency contacts documented
- [ ] Rollback procedure tested
- [ ] Postmortem template created

---

## 📋 Platform-Specific Checklists

### Vercel
- [ ] Project linked to repository
- [ ] Environment variables set in dashboard
- [ ] Google Sheets API credentials added
- [ ] Custom domain configured (optional)
- [ ] Deployment hooks configured (optional)
- [ ] Preview deployments tested

### Fly.io
- [ ] Fly app created: `fly apps create`
- [ ] PostgreSQL database created: `fly postgres create`
- [ ] Database attached: `fly postgres attach`
- [ ] Secrets set: `fly secrets set JWT_SECRET=...`
- [ ] Database schema initialized
- [ ] Autoscaling configured in `fly.toml`
- [ ] Health checks passing

### Render
- [ ] Web service created
- [ ] PostgreSQL database created
- [ ] Environment variables configured
- [ ] Database schema initialized
- [ ] Auto-deploy enabled
- [ ] Custom domain configured (optional)
- [ ] Health check path set to `/api/health`

### Docker (Self-Hosted)
- [ ] Docker Compose file reviewed
- [ ] Volumes configured for persistence
- [ ] Network isolation configured
- [ ] Container health checks working
- [ ] Automatic restarts enabled
- [ ] Reverse proxy configured (nginx/Traefik)
- [ ] SSL/TLS certificates installed
- [ ] Log rotation configured

---

## ✨ Final Sign-Off

### Deployment Team
- [ ] Developer approval: __________________ Date: __________
- [ ] QA approval: __________________ Date: __________
- [ ] DevOps approval: __________________ Date: __________
- [ ] Product owner approval: __________________ Date: __________

### Production Metrics Baseline
- [ ] Response time baseline: __________ ms
- [ ] Error rate baseline: __________ %
- [ ] CPU usage baseline: __________ %
- [ ] Memory usage baseline: __________ MB
- [ ] Database connections baseline: __________

### Rollback Plan
- [ ] Rollback trigger criteria defined
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Team trained on rollback process

---

## 🎉 Deployment Complete!

**Deployed By:** __________________

**Deployment Date:** __________________

**Deployment Platform:** __________________

**Production URL:** __________________

**Health Check URL:** __________________/api/health

---

## 📞 Emergency Contacts

- **Platform Support:** __________________
- **Database Support:** __________________
- **On-Call Engineer:** __________________
- **Team Lead:** __________________

---

**Notes:**
