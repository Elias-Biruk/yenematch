# YeneMatch Architecture

## Overview

YeneMatch is a production-quality Telegram Mini App for Ethiopian adults (18+). It functions as a modern dating platform that works both as a Telegram Mini App and as a standalone responsive web application.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: Telegram Mini App init data validation (server-side)
- **Testing**: Jest + React Testing Library + Playwright
- **Deployment**: Vercel (recommended) or similar

## Architecture Pattern

Single full-stack Next.js application with clear layer separation:

```
┌─────────────────────────────────────────┐
│         Presentation Layer               │
│  (UI Components, Pages, Client State)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API Layer                        │
│  (Route Handlers, Validation, Auth)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Service Layer                    │
│  (Business Logic, Discovery, Matching)  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Data Layer                       │
│  (Prisma, Database Models)               │
└─────────────────────────────────────────┘
```

## Folder Structure

```
yene-match/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── (main)/
│   │   ├── discover/
│   │   ├── likes/
│   │   ├── matches/
│   │   ├── messages/
│   │   └── profile/
│   ├── admin/
│   ├── api/
│   │   ├── auth/
│   │   ├── profiles/
│   │   ├── discovery/
│   │   ├── likes/
│   │   ├── matches/
│   │   ├── messages/
│   │   ├── reports/
│   │   └── blocks/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── modal.tsx
│   │   ├── sheet.tsx
│   │   ├── toast.tsx
│   │   ├── form-fields/
│   │   └── ...
│   ├── layout/
│   │   ├── bottom-nav.tsx
│   │   ├── header.tsx
│   │   └── ...
│   ├── brand/
│   │   ├── logo.tsx
│   │   └── ...
│   ├── profile/
│   ├── discovery/
│   ├── messaging/
│   └── ...
├── lib/
│   ├── db/
│   │   └── prisma.ts
│   ├── telegram/
│   │   ├── validation.ts
│   │   ├── client.ts
│   │   └── types.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── discovery.service.ts
│   │   ├── matching.service.ts
│   │   ├── messaging.service.ts
│   │   └── moderation.service.ts
│   ├── validators/
│   │   ├── profile.schema.ts
│   │   ├── auth.schema.ts
│   │   └── ...
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── rate-limit.ts
│   │   └── ...
│   └── constants.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── images/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── ARCHITECTURE.md
├── README.md
├── SECURITY.md
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

### Core Models

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ModerationStatus {
  ACTIVE
  UNDER_REVIEW
  SUSPENDED
  BANNED
  DELETED
}

enum ReportReason {
  INAPPROPRIATE_CONTENT
  HARASSMENT
  SCAM
  FAKE_PROFILE
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}

model User {
  id                String            @id @default(cuid())
  telegramId        String            @unique
  firstName         String
  lastName          String?
  username          String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  profile           Profile?
  sentLikes         Like[]            @relation("SentLikes")
  receivedLikes     Like[]            @relation("ReceivedLikes")
  matches1          Match[]           @relation("User1Matches")
  matches2          Match[]           @relation("User2Matches")
  sentMessages      Message[]         @relation("SentMessages")
  receivedMessages  Message[]         @relation("ReceivedMessages")
  sentReports       Report[]          @relation("SentReports")
  receivedReports   Report[]          @relation("ReceivedReports")
  blockedUsers      Block[]           @relation("Blocker")
  blockedBy         Block[]           @relation("Blocked")
  preferences       Preference?
  
  @@index([telegramId])
  @@index([createdAt])
}

model Profile {
  id                String            @id @default(cuid())
  userId            String            @unique
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  age               Int
  gender            Gender
  city              String
  bio               String?
  photos            Photo[]
  interests         Interest[]
  moderationStatus  ModerationStatus  @default(ACTIVE)
  completedOnboarding Boolean          @default(false)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  @@index([userId])
  @@index([gender])
  @@index([city])
  @@index([moderationStatus])
}

model Photo {
  id          String   @id @default(cuid())
  profileId   String
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  url         String
  order       Int
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([profileId])
}

model Interest {
  id          String   @id @default(cuid())
  profileId   String
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name        String
  createdAt   DateTime @default(now())
  
  @@index([profileId])
  @@unique([profileId, name])
}

model Like {
  id          String   @id @default(cuid())
  likerId     String
  liker       User     @relation("SentLikes", fields: [likerId], references: [id], onDelete: Cascade)
  likedId     String
  liked       User     @relation("ReceivedLikes", fields: [likedId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  
  @@unique([likerId, likedId])
  @@index([likerId])
  @@index([likedId])
}

model Match {
  id          String   @id @default(cuid())
  user1Id     String
  user1       User     @relation("User1Matches", fields: [user1Id], references: [id], onDelete: Cascade)
  user2Id     String
  user2       User     @relation("User2Matches", fields: [user2Id], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  
  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
}

model Message {
  id          String   @id @default(cuid())
  matchId     String
  match       Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId  String
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)
  content     String
  createdAt   DateTime @default(now())
  
  @@index([matchId])
  @@index([senderId])
  @@index([receiverId])
}

model Report {
  id          String       @id @default(cuid())
  reporterId  String
  reporter    User         @relation("SentReports", fields: [reporterId], references: [id], onDelete: Cascade)
  reportedId  String
  reported    User         @relation("ReceivedReports", fields: [reportedId], references: [id], onDelete: Cascade)
  reason      ReportReason
  description String?
  status      ReportStatus @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([reporterId])
  @@index([reportedId])
  @@index([status])
}

model Block {
  blockerId   String   @id @default(cuid())
  blockedId   String   @id @default(cuid())
  blocker     User     @relation("Blocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked     User     @relation("Blocked", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  
  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
}

model Preference {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  preferredGender   Gender?
  minAge            Int      @default(18)
  maxAge            Int      @default(100)
  preferredCity     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
}
```

## Security Considerations

### Authentication Security
- **Server-side validation**: All Telegram init data is validated on the server using the bot token
- **No token exposure**: TELEGRAM_BOT_TOKEN is never exposed to the client
- **Session management**: Secure HTTP-only cookies for session tokens
- **CSRF protection**: Built-in Next.js CSRF protection for API routes

### Data Protection
- **Telegram IDs**: Treated as sensitive internal identifiers, never exposed in UI
- **Location**: Only city/region stored, never exact coordinates
- **PII minimization**: Only necessary personal information collected
- **Account deletion**: Server-side deletion with data anonymization

### API Security
- **Rate limiting**: Implemented for auth, likes, messages, reports
- **Input validation**: All inputs validated server-side with Zod schemas
- **Authorization checks**: Every API route verifies user permissions
- **Error handling**: Generic error messages, no stack traces exposed

### Database Security
- **Constraints**: Unique constraints prevent duplicates (likes, matches, blocks)
- **Cascading deletes**: Proper cleanup when users are deleted
- **Indexes**: Optimized queries with proper indexing
- **Connection pooling**: Secure connection management

## Telegram Mini App Integration

### Integration Points

1. **Authentication Flow**
   - Frontend receives Telegram init data from Mini App SDK
   - Frontend sends init data to `/api/auth/validate`
   - Server validates using bot token
   - Server creates/updates user and session
   - Session cookie returned to client

2. **Environment Detection**
   - `lib/telegram/client.ts` detects Telegram environment
   - Graceful degradation for web-only usage
   - Development mode with mock auth for testing

3. **Required Environment Variables**
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_WEB_APP_URL=https://your-domain.com
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your_secret
   NODE_ENV=development
   ```

### Abstraction Layer

```typescript
// lib/telegram/client.ts
export class TelegramClient {
  isTelegramWebApp(): boolean
  getInitData(): string
  expandWebApp(): void
  closeWebApp(): void
  showPopup(options): void
}

// lib/telegram/validation.ts
export function validateTelegramInitData(
  initData: string,
  botToken: string
): Promise<TelegramUser>
```

## Implementation Phases

### Phase 1: Foundation (Current)
- Project initialization
- Database configuration
- Brand/theme system
- Basic layout
- Error handling

### Phase 2: Authentication
- Telegram auth validation
- Session management
- Protected routes

### Phase 3: Onboarding
- 18+ confirmation
- Profile creation
- Photo upload
- Interests selection

### Phase 4: Profiles
- Profile viewing
- Profile editing
- Photo management

### Phase 5: Discovery
- Profile cards
- Like/Pass actions
- Filtering logic

### Phase 6: Matching
- Mutual like detection
- Match creation
- Match list

### Phase 7: Messaging
- One-to-one messaging
- Message validation
- Rate limiting

### Phase 8: Safety
- Block/Report
- Unmatch
- Admin interface

### Phase 9: Settings
- Preferences
- Privacy controls
- Account deletion

### Phase 10: Production
- Testing
- Security review
- Deployment
- Documentation

## Key Design Decisions

### Single vs. Separate Apps
**Decision**: Single full-stack Next.js application
**Reasoning**: 
- Simpler deployment and maintenance
- Shared types and validation
- Built-in API routes
- Easier development workflow

### Authentication Strategy
**Decision**: Server-side Telegram init data validation
**Reasoning**:
- Security-first approach
- No client-side trust
- Works for both Telegram and web (with dev mode)

### Messaging Architecture
**Decision**: Simple polling-based for MVP
**Reasoning**:
- Sufficient for initial launch
- Avoids WebSocket complexity
- Can upgrade to real-time later

### Rate Limiting
**Decision**: Redis-based for production, in-memory for dev
**Reasoning**:
- Production-ready scaling
- Simple development setup
- Documented dependency

### Discovery Algorithm
**Decision**: Simple filtering-based matching
**Reasoning**:
- Maintainable for MVP
- Can enhance with ML later
- Predictable behavior

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/yene_match

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEB_APP_URL=https://your-domain.com

# Application
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NODE_ENV=development

# Optional: Rate Limiting (Redis)
REDIS_URL=redis://localhost:6379

# Optional: Image Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Development Workflow

1. **Setup**: Run `npm install` and configure `.env`
2. **Database**: Run `npx prisma migrate dev` and `npx prisma db seed`
3. **Dev server**: Run `npm run dev`
4. **Testing**: Run `npm test` for unit, `npm run test:e2e` for e2e
5. **Build**: Run `npm run build` to verify production build
6. **Lint**: Run `npm run lint` and `npm run type-check`

## Deployment Strategy

1. **Database**: Managed PostgreSQL (Supabase, Neon, or Railway)
2. **Backend**: Vercel (recommended for Next.js)
3. **Telegram**: Configure Mini App URL in BotFather
4. **Environment**: Set all env variables in deployment platform
5. **Migrations**: Run `npx prisma migrate deploy` on deploy

## Quality Gates

Before considering MVP complete:

- [ ] TypeScript type checking passes
- [ ] ESLint passes with no errors
- [ ] Unit tests cover critical business logic
- [ ] Integration tests cover API flows
- [ ] Production build succeeds
- [ ] Manual mobile testing completed
- [ ] All 17 verification scenarios pass
- [ ] Security review completed
- [ ] Telegram secrets verified not exposed
