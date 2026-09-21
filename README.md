# YeneMatch

A modern dating and connection platform designed for Ethiopian adults (18+). Built as a Telegram Mini App that also works as a standalone responsive web application.

## Tagline

"Find Your Yene."

## Tech Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: Telegram Mini App init data validation (server-side)
- **Testing**: Jest + React Testing Library + Playwright

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation, including:
- Folder structure
- Database schema
- Security considerations
- Telegram integration points
- Implementation phases

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Telegram Bot (for Mini App integration)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/yene_match
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   TELEGRAM_WEB_APP_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   NODE_ENV=development
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. (Optional) Seed development data:
   ```bash
   npx prisma db seed
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations
- `npx prisma db seed` - Seed database with development data
- `npx prisma studio` - Open Prisma Studio

## Database Setup

### Local PostgreSQL

Using Docker:
```bash
docker run --name yene-match-db -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=yene_match -p 5432:5432 -d postgres
```

### Cloud PostgreSQL

Recommended options:
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Railway](https://railway.app)

Update `DATABASE_URL` in your `.env` file with your connection string.

## Telegram Mini App Setup

1. Create a bot via [BotFather](https://t.me/botfather)
2. Copy the bot token to `TELEGRAM_BOT_TOKEN` in `.env`
3. Configure your Mini App URL in BotFather
4. Set `TELEGRAM_WEB_APP_URL` to your deployed application URL

## Brand Colors

- **Emerald (Primary)**: `#006B4F`
- **Burgundy (Secondary)**: `#7A1235`
- **Gold (Accent)**: `#C9A227`
- **Cream (Background)**: `#F7F2E8`
- **Ink (Text)**: `#171717`

## Project Structure

```
yene-match/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   └── brand/          # Brand components
├── lib/                # Utility libraries
│   ├── db/            # Database client
│   ├── telegram/      # Telegram integration
│   ├── services/      # Business logic services
│   ├── validators/    # Zod schemas
│   └── utils/         # Utilities
├── prisma/            # Database schema and migrations
└── tests/             # Test files
```

## Security

- Telegram authentication is validated server-side
- Bot token is never exposed to the client
- All inputs are validated server-side
- Rate limiting on sensitive endpoints (in-memory, single-instance)
- Proper database constraints and indexes
- Magic byte validation for photo uploads
- Security headers (X-Content-Type-Options, Referrer-Policy)

**Rate Limiting Note**: The current rate limiter uses in-memory storage and is suitable for single-instance deployments. For multi-instance production deployments, implement a distributed rate limiter using Redis or similar technology.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed security considerations.

## Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all variables from `.env.example` are set in your deployment platform.

## Contributing

This is a private project. Follow the development workflow outlined in ARCHITECTURE.md.

## License

Private - All rights reserved.
