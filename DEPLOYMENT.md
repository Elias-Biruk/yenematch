# YeneMatch Deployment Guide

This guide covers deploying YeneMatch to a staging or production environment.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (PostgreSQL 14+ recommended)
- Telegram Bot configured via BotFather
- Cloudinary account for photo storage
- Deployment platform (Vercel, Railway, AWS, etc.)

## Environment Variables

### Required Production Secrets

These must be set in your production environment. Do not commit these to version control.

```bash
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database

# Next.js/Session Security
NEXTAUTH_SECRET=<random-32-character-string>

# Telegram Bot
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token-from-botfather>

# Cloudinary (Photo Storage)
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

### Required Public Configuration

```bash
# Application URL (for Telegram redirect)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Telegram Bot Username (for Mini App initialization)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=@your_bot_username
```

### Optional Development Variables

These should NOT be set in production.

```bash
# Development Authentication (DO NOT SET IN PRODUCTION)
DEV_AUTH_ENABLED=false
```

**CRITICAL:** Ensure `DEV_AUTH_ENABLED` is not set or is set to `false` in production. This bypasses Telegram authentication.

## Database Setup

### 1. Create Database

Create a PostgreSQL database for your application:

```sql
CREATE DATABASE yene_match;
```

### 2. Configure Connection

Set `DATABASE_URL` in your environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:5432/yene_match
```

### 3. Run Migrations

Deploy all Prisma migrations to the production database:

```bash
npx prisma migrate deploy
```

**IMPORTANT:** Use `migrate deploy`, NOT:
- `prisma db push` (bypasses migration history)
- `prisma migrate reset` (deletes all data)

### 4. Generate Prisma Client

Generate the Prisma client for production:

```bash
npx prisma generate
```

### 5. Verify Migration Status

Verify all migrations are applied:

```bash
npx prisma migrate status
```

Expected output: `Database schema is up to date!`

## Telegram Configuration

### 1. Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Start a chat and send `/newbot`
3. Follow the prompts to create your bot
4. Save the **Bot Token** (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Save the **Bot Username** (e.g., `@yene_match_bot`)

### 2. Configure Mini App

1. Send `/newapp` to BotFather
2. Select your bot
3. Set the **Short Name** (e.g., `yene_match`)
4. Set the **Title** (e.g., `YeneMatch`)
5. Set the **Description**
6. Set the **Webhook URL** to your deployed frontend: `https://your-domain.com`
7. Upload an application icon and banner

### 3. Set Environment Variables

```bash
TELEGRAM_BOT_TOKEN=<your-bot-token>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=@your_bot_username
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. Authentication Flow

The production authentication flow:

1. User opens Mini App in Telegram
2. Telegram sends `initData` to your frontend
3. Frontend sends `initData` to `/api/auth/validate`
4. Server validates `initData` with Telegram Bot API
5. Server creates authenticated session
6. User proceeds to onboarding/discovery

**Security Notes:**
- `initData` is validated server-side using Telegram Bot API
- Session identity is authoritative (never trust client-provided IDs)
- DEV_AUTH must be disabled in production

## Cloudinary Configuration

### 1. Create Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Create a new cloud (e.g., `yene-match`)

### 2. Get API Credentials

Navigate to your Cloudinary dashboard and copy:
- **Cloud Name** (e.g., `yene-match`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3. Set Environment Variables

```bash
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### 4. Configure Upload Settings (Optional)

Configure upload presets in Cloudinary dashboard for:
- Image format (webp recommended)
- Size limits (e.g., max 5MB)
- Auto-optimization
- Face detection cropping

## Admin Bootstrap

### Overview

The admin system requires at least one SUPER_ADMIN user to manage the platform. This is done via a server-side bootstrap script.

### Bootstrap Procedure

1. **Deploy the application** first (see Build & Start below)
2. **Complete onboarding** as a normal user in the deployed app
3. **Get your user ID** from the database or through the API
4. **Run the bootstrap script**:

```bash
node scripts/bootstrap-admin.js <userId>
```

5. **Confirm the action** when prompted
6. **Access the admin panel** at `/admin/dashboard`

### Security Features

- Server-side script only (not a public HTTP endpoint)
- Requires direct console access
- Creates an audit log entry
- Refuses to promote users who are already SUPER_ADMIN
- Requires explicit confirmation before executing

### Example

```bash
# After deploying and completing onboarding
node scripts/bootstrap-admin.js 550e8400-e29b-41d4-a716-446655440000

# Output:
# 🔐 Admin Bootstrap Script
# ========================
# 
# 🔍 Looking up user: 550e8400-e29b-41d4-a716-446655440000
# ✅ Found user: John Doe
#    Current role: USER
# 
# ⚠️  This action will:
#    - Promote this user to SUPER_ADMIN role
#    - Create an audit log entry
#    - Grant full administrative access
# 
# Do you want to proceed? (yes/no): yes
# 
# 📝 Promoting user to SUPER_ADMIN...
# 📋 Creating audit log entry...
# 
# ✅ Admin bootstrap completed successfully!
#    User John Doe is now SUPER_ADMIN
```

## Build & Start

### Build the Application

```bash
npm run build
```

This creates an optimized production build in `.next/`.

### Start the Application

```bash
npm start
```

The application will start on the port specified in your environment or default to 3000.

### Platform-Specific Deployment

#### Vercel

Vercel is recommended for Next.js applications:

1. Connect your Git repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Build Command:** `npm run build`
**Start Command:** `npm start`

#### Railway

1. Create a new project on Railway
2. Connect your Git repository
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy automatically

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t yene-match .
docker run -p 3000:3000 --env-file .env yene-match
```

## Post-Deployment Verification

### 1. Health Check

Verify the application is running:

```bash
curl https://your-domain.com/
```

Expected: HTML response with application content.

### 2. Database Connection

Verify database connectivity:

```bash
npx prisma migrate status
```

Expected: `Database schema is up to date!`

### 3. Telegram Mini App

1. Open your Telegram bot
2. Launch the Mini App
3. Verify authentication works (no DEV_AUTH)
4. Complete onboarding
5. Test discovery, likes, matches
6. Test messaging

### 4. Admin Panel

1. Complete onboarding as your admin user
2. Run bootstrap script
3. Access `/admin/dashboard`
4. Verify statistics display
5. Test user management
6. Test report management
7. Verify audit logs

### 5. Photo Upload

1. Navigate to profile edit
2. Upload a photo
3. Verify photo appears in profile
4. Check Cloudinary dashboard for upload

## Rollback Considerations

### Database Rollback

If a migration causes issues:

```bash
# View migration history
npx prisma migrate status

# Rollback to previous migration (last resort)
npx prisma migrate resolve --rolled-back <migration-name>
```

**WARNING:** Rolling back migrations may cause data loss. Test migrations in staging first.

### Application Rollback

#### Vercel

- Vercel maintains automatic deployments
- Rollback to previous deployment in Vercel dashboard

#### Railway

- Railway maintains deployment history
- Rollback to previous deployment in Railway dashboard

#### Docker

```bash
# Stop current container
docker stop yene-match

# Run previous image
docker run -p 3000:3000 --env-file .env yene-match:previous-tag
```

## Security Checklist

### Before Deployment

- [ ] All environment variables are set
- [ ] `DEV_AUTH_ENABLED` is not set or is `false`
- [ ] `NEXTAUTH_SECRET` is a random 32+ character string
- [ ] Database uses strong password
- [ ] Cloudinary API credentials are secure
- [ ] Telegram Bot Token is kept secret
- [ ] HTTPS is enabled on production domain
- [ ] Database is not publicly accessible (whitelist IPs)

### After Deployment

- [ ] Admin bootstrap completed
- [ ] Audit logs are working
- [ ] Telegram authentication is working
- [ ] Photo uploads are working
- [ ] No sensitive data is exposed in API responses
- [ ] Rate limiting is functional
- [ ] Error logging is configured
- [ ] Monitoring is set up

### Ongoing

- [ ] Regularly review audit logs
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated
- [ ] Backup database regularly
- [ ] Review security advisories

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Regenerate Prisma client
npx prisma generate

# Check migration status
npx prisma migrate status
```

### Telegram Authentication Fails

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Verify `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is correct
- Verify `NEXT_PUBLIC_APP_URL` matches Telegram webhook
- Check BotFather webhook configuration
- Ensure `DEV_AUTH_ENABLED` is `false`

### Photo Upload Fails

- Verify Cloudinary credentials are correct
- Check Cloudinary account limits
- Verify `CLOUDINARY_CLOUD_NAME` matches your cloud
- Check file size limits in Cloudinary

### Admin Panel Not Accessible

- Verify user was promoted to SUPER_ADMIN
- Check audit logs for bootstrap entry
- Verify session is authenticated
- Check browser console for errors

## Support

For issues during deployment:

1. Check application logs
2. Verify environment variables
3. Test database connection
4. Review this troubleshooting section
5. Check GitHub issues for known problems

## Appendix

### Current Migration Count

The application currently has **6 migrations** that must be deployed:

1. `20260918033604_add_preference_fields`
2. `20260918040533_add_pass_model`
3. `20260920093000_add_messaging_features`
4. `20260920100000_update_report_status`
5. `20260920120000_add_cloudinary_public_id`
6. `20260920130000_add_admin_system`

### Current Test Coverage

- **Total Tests:** 121
- **Test Suites:** 12
- **Passing:** 121/121
- **Coverage Areas:** Authentication, matching, messaging, reports, admin authorization, moderation

### Production Build Output

Routes:
- 39 total routes
- 7 admin API routes
- 6 admin UI pages
- Dynamic routes for users, reports, messages

### Dependencies

Key production dependencies:
- Next.js 16.3.5
- Prisma 5.22.0
- PostgreSQL
- Cloudinary SDK
- Zod (validation)
- Telegram API
