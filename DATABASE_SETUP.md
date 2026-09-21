# Database Setup Guide

This guide explains how to set up PostgreSQL for YeneMatch development.

## Option 1: Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Start PostgreSQL container:**
   ```bash
   docker-compose up -d
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   docker-compose ps
   ```

3. **Stop PostgreSQL (when done):**
   ```bash
   docker-compose down
   ```

### Environment Variables

The `docker-compose.yml` file uses these credentials:
- User: `yene_match_user`
- Password: `yene_match_password`
- Database: `yene_match`
- Port: `5432`

Your `.env` file should have:
```
DATABASE_URL=postgresql://yene_match_user:yene_match_password@localhost:5432/yene_match
```

## Option 2: Local PostgreSQL Installation

### Prerequisites
- PostgreSQL 15+ installed locally

### Steps

1. **Create database:**
   ```bash
   createdb yene_match
   ```

2. **Update your `.env` file with your credentials:**
   ```
   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/yene_match
   ```

## Prisma Setup

After PostgreSQL is running:

1. **Validate Prisma schema:**
   ```bash
   npx prisma validate
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Create and apply migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed database (optional):**
   ```bash
   npx prisma db seed
   ```

## Troubleshooting

### PostgreSQL connection errors
- Ensure PostgreSQL is running: `docker-compose ps` or check local PostgreSQL
- Verify DATABASE_URL in `.env` matches your PostgreSQL credentials
- Check that port 5432 is not already in use

### Prisma errors
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply schema changes
- Use `npx prisma studio` to visually inspect the database
