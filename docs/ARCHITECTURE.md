# RevisionAI — Architecture Document

**Version:** 1.0
**Date:** June 3, 2026
**Status:** Draft

---

## 1. HIGH-LEVEL ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          REVISION AI SYSTEM                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   INGESTION       │    │   BACKEND API     │    │   FRONTEND PWA    │   │
│  │   PIPELINE        │    │   (.NET 10)       │    │   (Angular 21)    │   │
│  │   (Python)        │    │                   │    │                   │   │
│  │                   │    │ ┌───────────────┐ │    │ ┌───────────────┐ │   │
│  │ PDF → PNG → JSON  │    │ │  Controllers  │ │    │ │  Components   │ │   │
│  │ → Validate → DB   │    │ │  (REST API)   │ │    │ │  (Standalone) │ │   │
│  │                   │    │ └───────┬───────┘ │    │ └───────┬───────┘ │   │
│  │ One-time run      │    │         │         │    │         │         │   │
│  └────────┬─────────┘    │ ┌───────▼───────┐ │    │ ┌───────▼───────┐ │   │
│           │              │ │  Application  │ │    │ │   Services    │ │   │
│           │              │ │  (MediatR)    │ │    │ │   (NgRx)     │ │   │
│           │              │ └───────┬───────┘ │    │ └───────┬───────┘ │   │
│           │              │         │         │    │         │         │   │
│           ▼              │ ┌───────▼───────┐ │    │ ┌───────▼───────┐ │   │
│  ┌──────────────────┐    │ │Infrastructure │ │    │ │   PWA + SW   │ │   │
│  │   DEEPSEEK V4    │    │ │  (EF + Blob)  │ │    │ │  (Offline)   │ │   │
│  │   Vision + Chat   │    │ └───────┬───────┘ │    │ └───────────────┘ │   │
│  └──────────────────┘    └─────────┼─────────┘    └──────────────────┘   │
│                                    │                                      │
│                           ┌────────▼─────────┐                           │
│                           │   POSTGRESQL 16  │                           │
│                           │   + pgvector     │                           │
│                           └──────────────────┘                           │
│                                    │                                      │
│                           ┌────────▼─────────┐                           │
│                           │  AZURE BLOB      │                           │
│                           │  (Images/Notes)  │                           │
│                           └──────────────────┘                           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     AZURE CLOUD INFRASTRUCTURE                     │   │
│  │  App Service │ Static Web Apps │ PostgreSQL │ Blob │ Key Vault    │   │
│  │  Application Insights │ CI/CD (GitHub Actions)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TECHNOLOGY STACK

### 2.1 Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | .NET 10 | High-performance, cross-platform |
| **API Framework** | ASP.NET Core Minimal/Controller APIs | REST endpoints |
| **CQRS** | MediatR 12+ | Command/Query separation |
| **Validation** | FluentValidation | Request validation pipeline |
| **ORM** | Entity Framework Core 10 | Database access, migrations |
| **Database** | PostgreSQL 16 + pgvector | Primary data store + vector search (future) |
| **Auth** | JWT + Refresh Tokens | Stateless authentication |
| **OAuth** | Google OAuth 2.0 | Social login |
| **Caching** | IMemoryCache | OTP storage, AI response caching |
| **Background Jobs** | IHostedService / BackgroundService | Hourly question delivery |
| **Logging** | Serilog | Structured logging |
| **Telemetry** | Application Insights | Performance monitoring |
| **Testing** | xUnit + Moq + FluentAssertions | Unit & integration tests |

### 2.2 Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Angular 21 | SPA with standalone components |
| **State Management** | NgRx SignalStore | Reactive state |
| **Reactive** | RxJS 7+ | Observable streams |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Animations** | GSAP (GreenSock) | Complex animations |
| **Charts** | Chart.js + ng2-charts | Analytics visualization |
| **Particles** | tsParticles | Level-up effects |
| **PWA** | @angular/pwa | Installable app, service worker |
| **Offline** | IndexedDB (via idb) | Local question cache |
| **Testing** | Jasmine + Playwright | Component + E2E tests |

### 2.3 Pipeline (Data Ingestion)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Language** | Python 3.12+ | Scripting & AI orchestration |
| **PDF Processing** | PyMuPDF (fitz) | PDF slicing & page rendering |
| **Vision AI** | DeepSeek V4 Pro (Vision) | Document → structured JSON |
| **Chat AI** | DeepSeek V4 Pro (Chat) | AI explanations, chat tutor |
| **Image Processing** | Pillow | Image validation & optimization |
| **Cloud Storage** | Azure Blob Storage SDK | Upload page images |
| **Database** | psycopg2 / EF Core | Bulk insert questions |

### 2.4 DevOps & Infrastructure

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **CI/CD** | GitHub Actions | Build, test, deploy |
| **Containerization** | Docker + Docker Compose | Local dev environment |
| **Hosting** | Azure App Service (Linux) | .NET API hosting |
| **Frontend Hosting** | Azure Static Web Apps | Angular PWA hosting |
| **Database** | Azure PostgreSQL Flexible Server | Managed PostgreSQL |
| **Storage** | Azure Blob Storage | Images, notes, media |
| **Secrets** | Azure Key Vault | API keys, connection strings |
| **Monitoring** | Application Insights | Telemetry & alerts |

---

## 3. CLEAN ARCHITECTURE (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                    RevisionAI.Api                            │
│  Controllers, Program.cs, Middleware, appsettings.json      │
│  References: Application, Infrastructure, Contracts         │
├─────────────────────────────────────────────────────────────┤
│                 RevisionAI.Application                       │
│  Commands, Queries, Handlers (MediatR), Validators           │
│  Interfaces (IAppDbContext, ISm2Service, etc.)              │
│  References: Domain, Contracts                              │
├─────────────────────────────────────────────────────────────┤
│                  RevisionAI.Domain                           │
│  Entities, Value Objects, Enums, Domain Exceptions           │
│  Pure. No references to external packages.                  │
├─────────────────────────────────────────────────────────────┤
│               RevisionAI.Infrastructure                      │
│  AppDbContext, EF Configurations, Migrations                 │
│  Service Implementations (JWT, SM-2, DeepSeek, Blob)       │
│  References: Application, Domain                             │
├─────────────────────────────────────────────────────────────┤
│                 RevisionAI.Contracts                         │
│  DTOs, Request/Response models, Shared contracts            │
│  Pure. No references.                                        │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rule
- **Domain** knows nothing. It's pure C#.
- **Application** knows Domain and Contracts. Defines interfaces.
- **Infrastructure** implements Application interfaces. Knows external services.
- **Api** wires everything together. References Application, Infrastructure, Contracts.
- **Contracts** is shared shapes. Frontend can consume these as TypeScript types.

---

## 4. DATABASE SCHEMA (Key Tables)

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  User    │────→│ UserAttempt  │←────│  Question   │
└──────────┘     └──────────────┘     └────────────┘
     │                                      │
     ├── UserStreak                         ├── QuestionMedia
     ├── UserXp                             ├── QuestionSchedule
     ├── XpTransaction                      │
     ├── BookmarkCollection                 ├── Subject
     │   └── BookmarkItem                   │   └── Chapter
     ├── UserNote                               └── Topic
     ├── Friendship (Requester/Addressee)
     ├── PendingQuestion ←── Question
     ├── MockSession
     │   └── MockSessionAnswer ←── Question
     ├── RefreshToken
     └── Achievement
```

### Key Design Decisions

1. **CorrectOption hidden at API level, not DB level** — The DB stores the correct answer. The API query layer decides whether to include it (detail endpoint) or exclude it (list endpoint).

2. **QuestionSchedule tracks per-user SR state** — Each (user, question) pair has its own easeFactor, interval, nextReviewDate. This enables personalized spaced repetition.

3. **PendingQuestion has 24-hour expiry** — The hourly engine creates rows. A background sweeper marks expired ones. The GET endpoint filters out expired.

4. **Confidence is optional** — Students may skip confidence rating. P2 feature.

5. **All timestamps are UTC** — Configured in DbContext. No local timezone ambiguity.

6. **JSON column for MockConfig** — Stores the mock generation parameters as a JSON string (PostgreSQL JSONB). Allows flexible mock configuration without schema changes.

---

## 5. KEY DESIGN PATTERNS

### 5.1 CQRS (Command Query Responsibility Segregation)

```
Command (mutates state):
  Request → Validator → Handler → DB write → Response

Query (reads state):
  Request → Validator → Handler → DB read (projection) → Response
```

All commands return `IRequest<T>`. All queries return `IRequest<T>`. No business logic in controllers.

### 5.2 Background Service Pattern

```
HourlyQuestionService : BackgroundService
  ├── Runs every hour (PeriodicTimer)
  ├── Fetches active users
  ├── Selects 2 questions per user (QuestionSelectionStrategy)
  ├── Creates PendingQuestion records
  └── Triggers push notifications

ExpiredQuestionSweeper : BackgroundService
  ├── Runs every 15 minutes
  └── Marks PendingQuestion rows where ExpiresAt < now

MockCompletionService (future)
  └── Auto-submits mock sessions when timer expires
```

### 5.3 Strategy Pattern (Question Selection)

```
IQuestionSelectionStrategy
  └── WeightedQuestionSelectionStrategy
        ├── Priority 1 (40%): Spaced repetition due cards
        ├── Priority 2 (30%): Weak topic questions
        ├── Priority 3 (20%): Unseen questions
        └── Priority 4 (10%): Random discovery
```

### 5.4 Service Pattern (Gamification Chain)

```
Answer submitted
  → Sm2Service.CalculateNextReview()
  → XpService.AwardXp()
  → StreakService.UpdateStreak()
  → AchievementService.CheckAchievements()
  → Return combined result
```

---

## 6. API DESIGN CONVENTIONS

### 6.1 RESTful Endpoints

| Method | Pattern | Example |
|--------|---------|---------|
| GET (list) | `/api/{resource}` | `GET /api/questions?subjectSlug=surgery&page=1` |
| GET (by id) | `/api/{resource}/{id:guid}` | `GET /api/questions/abc-123` |
| POST (create) | `/api/{resource}` | `POST /api/mocks/generate` |
| POST (action) | `/api/{resource}/{id}/{action}` | `POST /api/mocks/abc-123/submit` |
| DELETE | `/api/{resource}/{id}` | `DELETE /api/notes/abc-123` |

### 6.2 Response Envelope

```json
// Success
{
  "data": { ... },
  "meta": { "page": 1, "pageSize": 10, "totalCount": 450, "hasNext": true }
}

// Error
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Question not found",
    "details": null
  }
}
```

### 6.3 HTTP Status Codes

| Code | When |
|------|------|
| 200 | Successful GET, PUT |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Validation error |
| 401 | Missing/invalid JWT |
| 403 | Forbidden (not authorized for resource) |
| 404 | Resource not found |
| 409 | Conflict (duplicate friend request, etc.) |
| 429 | Rate limited |
| 500 | Unexpected server error |

---

## 7. AUTHENTICATION FLOW

```
┌──────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  GOOGLE OAUTH:                                            │
│  Client → Google Sign-In → ID Token                      │
│  → POST /api/auth/google { idToken }                     │
│  → Server verifies token with Google                      │
│  → Creates/finds User                                     │
│  → Returns: { accessToken (15min), refreshToken (7d) }    │
│                                                           │
│  EMAIL OTP:                                               │
│  Client → POST /api/auth/email/send-otp { email }        │
│  → Server generates 6-digit OTP                           │
│  → Stores in IMemoryCache (5min TTL)                      │
│  → [DEV] Logs OTP to console                              │
│  → [PROD] Sends email via resend/sendgrid                 │
│  Client → POST /api/auth/email/verify-otp { email, otp } │
│  → Server validates OTP                                   │
│  → Creates/finds User                                     │
│  → Returns JWT tokens                                     │
│                                                           │
│  REFRESH:                                                 │
│  Client → POST /api/auth/refresh { refreshToken }        │
│  → Server validates token is not expired/revoked          │
│  → Revokes old token                                      │
│  → Issues new accessToken + refreshToken                  │
│                                                           │
│  LOGOUT:                                                  │
│  Client → POST /api/auth/logout                          │
│  → Server revokes refresh token                           │
│  → Client clears local storage                            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 8. DATA INGESTION PIPELINE (Vision-First Architecture)

```
┌────────────────────────────────────────────────────────────────┐
│                 PHASE 1: INGESTION PIPELINE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: TOC EXTRACTOR                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ Contents │───→│ DeepSeek     │───→│ toc.json     │         │
│  │ page PNG │    │ Vision API   │    │ {chapters[]} │         │
│  └──────────┘    └──────────────┘    └──────────────┘         │
│                                                                 │
│  Step 2: PDF SLICER                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ PDF      │───→│ pdf_slicer   │───→│ chapter_01   │         │
│  │ + toc    │    │ .py          │    │   .pdf ...    │         │
│  └──────────┘    └──────────────┘    └──────────────┘         │
│                                                                 │
│  Step 3: PAGE RENDERER                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ chapter  │───→│ page_render  │───→│ page_001.png │         │
│  │ PDF      │    │ er.py (150dpi│    │ page_002.png │         │
│  └──────────┘    └──────────────┘    └──────────────┘         │
│                                                                 │
│  Step 4: VISION PARSER (The key step)                           │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ 3-5 PNGs │───→│ DeepSeek     │───→│ chapter_01   │         │
│  │ per call │    │ Vision API   │    │ .json        │         │
│  └──────────┘    └──────────────┘    └──────────────┘         │
│                                                                 │
│  Step 5: VALIDATOR                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ chapter  │───→│ validator.py │───→│ audit_report │         │
│  │ JSONs    │    │              │    │ .json/.md    │         │
│  └──────────┘    └──────────────┘    └──────────────┘         │
│                                                                 │
│  Step 6: STORAGE                                                │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ JSON +   │───→│ azure_upload │───→│ Azure Blob   │         │
│  │ PNGs     │    │ er.py        │    │ Storage      │         │
│  └──────────┘    └──────────────┘    └──────────────┘         │
│       │                                                        │
│       └──────────────────→ db_ingester.py → PostgreSQL         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Why Vision-First?

- Vision models understand layout, context, and naturally ignore watermarks and noise
- OCR-first approach (Azure Document Intelligence) failed due to watermark injection and symbol corruption
- DeepSeek V4 Pro Vision produces excellent results from page screenshots
- Trade-off: Higher cost per page vs OCR ($1-2 per chapter vs $0.10), but quality is significantly higher

---

## 9. SECURITY CONSIDERATIONS

| Concern | Mitigation |
|---------|-----------|
| **JWT theft** | Short access token (15min), refresh token rotation, token revocation on logout |
| **API key exposure** | DeepSeek key in Azure Key Vault, never in client code |
| **Injection attacks** | EF Core parameterized queries (no raw SQL for user input) |
| **XSS** | Angular's built-in sanitization. CSP headers. |
| **CSRF** | JWT in Authorization header (not cookies). Angular HttpClient handles this. |
| **Rate limiting** | ASP.NET Core rate limiter middleware (Phase 5.3) |
| **File upload** | 10MB max, image-only MIME type validation, virus scanning (future) |
| **Data isolation** | All queries scoped to authenticated user's ID. No cross-user data leaks. |

---

## 10. PERFORMANCE CONSIDERATIONS

| Concern | Strategy |
|---------|----------|
| **Large question dataset (50K+ rows)** | Pagination, indexed columns (SubjectId, ChapterId, TopicId), query projection |
| **Hourly job for N users** | Batched processing, async/await, no per-user synchronous calls |
| **Vision API latency** | Batch pages (3-5 per call), retry with backoff, process offline |
| **Angular bundle size** | Lazy-loaded feature modules. Each route has its own chunk. |
| **Image loading** | Lazy-load question media images. Compress PNG at 150 DPI. |
| **Database queries** | Avoid N+1 via eager loading (Include/ThenInclude) where needed. Use AsNoTracking() for read-only queries. |

---

## 11. TRADEOFFS & RATIONALE

| Decision | Alternative Considered | Why Chosen |
|----------|----------------------|------------|
| **PostgreSQL over SQL Server** | Azure SQL Database | PostgreSQL is cheaper, has pgvector, open-source, works identically in Docker |
| **SM-2 over FSRS** | Free Spaced Repetition Scheduler | SM-2 is simpler, needs no training data, 85% as effective, easy to upgrade later |
| **Monorepo over Polyrepo** | Separate backend/frontend repos | Solo developer. One `docker compose up` runs everything. Shared CI/CD. |
| **Angular PWA over React Native** | React Native + Expo | Angular aligns with job target. PWA is installable. One codebase for mobile+tablet+desktop. |
| **DeepSeek over OpenAI** | GPT-4o Vision | DeepSeek V4 Pro is significantly cheaper ($0.87/M output tokens), quality is comparable for structured extraction |
| **Clean Architecture over N-tier** | Simple 3-layer | Clean Architecture is interview gold. Demonstrates dependency inversion, CQRS, separation of concerns. |
| **MediatR over direct service calls** | Services injected directly | MediatR adds ceremony but enables pipeline behaviors (validation, logging, caching) and demonstrates CQRS pattern. |

---

---

## 12. PHASE 0.1 IMPLEMENTATION NOTES

### Completed
- .NET 10 solution with 5 Clean Architecture projects: Api, Application, Domain, Infrastructure, Contracts
- Angular **22** PWA with standalone components, Tailwind CSS v4, GSAP, NgRx Signals, Chart.js, tsparticles
- Docker Compose: PostgreSQL 16 (revisionai/revisionai/devpassword) + Azurite (ports 10000-10002)
- GitHub Actions CI: builds backend (dotnet build) and frontend (ng build) on push to main

### Key Changes from Original Plan
- **Angular 21 (not 19):** Upgraded to latest stable. Required Node.js upgrade from v20 → v22.
- **PWA files created manually:** `ng add @angular/pwa` schematic failed with peer dep conflicts. Identical result.
- **Serilog explicit config:** Replaced `ReadFrom.Configuration()` with `WriteTo.Console()` for dev visibility.
- **Explicit types enforced:** `TreatWarningsAsErrors` + IDE0008 requires explicit types over `var`.

### Build Verification
```bash
cd backend && dotnet build      # 0 errors, 0 warnings
cd frontend && npx ng build     # Successful (Angular 21)
cd docker && docker compose up -d  # PostgreSQL + Azurite running
```

---

## 13. PHASE 0.2 IMPLEMENTATION NOTES

### Database Schema — 20 Tables, 20 EF Core Configurations

The complete database schema has been implemented with 20 entity tables covering all core domain concepts:

| # | Table | Purpose |
|---|-------|---------|
| 1 | `Users` | Student accounts (email, display name, Google OAuth) |
| 2 | `Subjects` | 19 medical subjects seeded via migration |
| 3 | `Chapters` | Subject chapters with page ranges |
| 4 | `Topics` | Chapter topics with question counts |
| 5 | `Questions` | Core MCQ entities (text, 4 options, correct answer, explanation) |
| 6 | `QuestionMedia` | Clinical images, histology, radiology linked to questions |
| 7 | `QuestionSchedules` | Per-user spaced repetition state (SM-2: ease factor, interval, next review) |
| 8 | `UserAttempts` | Every question attempt with answer, correctness, timing, confidence |
| 9 | `PendingQuestions` | Hourly question queue with per-user expiry |
| 10 | `UserStreaks` | Daily streak tracking (current, longest, last active date) |
| 11 | `UserXp` | Total XP and current level for gamification |
| 12 | `XpTransactions` | Immutable XP audit trail with reason codes |
| 13 | `BookmarkCollections` | Named collections (e.g., "High-Yield", "Weak Areas") |
| 14 | `BookmarkItems` | Questions saved to collections |
| 15 | `UserNotes` | Handwritten/digital drawing notes linked to questions or topics |
| 16 | `Friendships` | Social connections (pending/accepted/declined) |
| 17 | `MockSessions` | Custom quiz sessions with JSONB config |
| 18 | `MockSessionAnswers` | Per-question answers within mock sessions |
| 19 | `RefreshTokens` | JWT refresh tokens (7-day expiry, revocable) |
| 20 | `Achievements` | Unlocked achievements (e.g., "7-day streak", "100 questions") |

### Key Implementation Decisions

1. **Fluent API over Data Annotations** — All entity configuration (20 config classes) in `Infrastructure/Data/Configurations/`. Domain entities are pure POCOs with no EF dependencies.

2. **Delete Behavior** — `Cascade` for child entities owned by a parent (UserAttempts → User). `Restrict` for reference data (Questions → Subjects). `SetNull` for optional relationships (Question → Topic).

3. **Indexed query paths** — Composite indexes on hot query patterns: `(UserId, QuestionId)` on UserAttempts, `(UserId, IsAnswered, ExpiresAt)` on PendingQuestions, `(UserId, QuestionId)` unique constraint on QuestionSchedules.

4. **JSONB for MockConfig** — `MockSessions.MockConfig` stores flexible mock generation parameters as PostgreSQL JSONB, enabling schema-less configuration without migrations.

5. **Seed data via migration** — 19 medical subjects seeded using `HasData()` with deterministic GUIDs for repeatability across environments.

6. **PostgreSQL text columns** — `QuestionText`, all `Option*`, `Explanation` use `text` type for unlimited length (some medical explanations are 1000+ characters).

7. **CA1861 suppression for migrations** — Auto-generated migration files get `generated_code = true` in `.editorconfig` to suppress constant-array analyzer warnings that are harmless in migrations.

8. **CorrectOption stored but hidden at API level** — The DB stores the correct answer. The query layer (Application) controls whether to include it.

### Schema Statistics
- 20 tables, 60+ indexes, 40+ foreign keys
- Migration file: ~40KB SQL in `20260603205756_InitialCreate.cs`
- Ready for Phase 0.3 (Authentication System)

### Verification Commands
```bash
cd backend && dotnet build                              # 0 errors, 0 warnings
docker exec revisionai-postgres psql -U revisionai -d   # Verify
  revisionai -c "SELECT COUNT(*) FROM \"Subjects\";"    # 19
```

---

## 14. PHASE 0.3 IMPLEMENTATION NOTES

### Authentication System — JWT Bearer + Google OAuth + Email OTP

Complete auth system with 5 API endpoints, 4 MediatR command/handlers, 4 infrastructure services, 3 FluentValidation validators, and JWT Bearer middleware.

### Key Implementation Decisions

1. **Interfaces in Application, Implementations in Infrastructure** — Following Clean Architecture's Dependency Inversion Principle, all service interfaces (`IJwtTokenService`, `IRefreshTokenService`, `IGoogleAuthService`, `IOtpService`, `IAppDbContext`) are defined in the Application layer. Infrastructure implements them. This keeps Application testable and free of external dependencies.

2. **`IAppDbContext` abstraction** — The `AppDbContext` now implements `IAppDbContext` with `IQueryable<T>` properties (not `DbSet<T>`) and an `Add<T>` method. This allows Application handlers to query and mutate data without referencing `Microsoft.EntityFrameworkCore` directly.

3. **JWT HS256 with config-driven key** — Access tokens are signed with HS256 using a key from `appsettings.json` (`Jwt:Key`). The key must be at least 32 characters. Issuer and audience are validated against `Jwt:Issuer` and `Jwt:Audience`. Claims: `sub` (userId), `email`, `displayName`, `jti` (unique token ID).

4. **Refresh token rotation with revocation** — On each refresh, the old refresh token's `RevokedAt` is set to `DateTime.UtcNow`, and a new refresh token entity is created. This prevents token reuse attacks. In the `RefreshTokenCommandHandler`, access is denied if a token is not found, is revoked, or is expired.

5. **OTP in-memory cache with sliding expiration** — `OtpService` uses ASP.NET Core's `IMemoryCache` with `MemoryCacheEntryOptions.SlidingExpiration = TimeSpan.FromMinutes(5)`. The sliding window means each validation attempt resets the timer. On successful verification, the OTP is invalidated via `_cache.Remove()`. Cache key: `otp:{normalized email}`.

6. **`[DEV OTP]` console logging** — In development, the OTP is logged to Serilog console output with `[DEV OTP]` prefix. This enables immediate curl-based testing without an email provider. Production email sending (SendGrid/Resend) will replace this in Phase 5.2.

7. **Google token validation via tokeninfo endpoint** — `GoogleAuthService` calls `https://oauth2.googleapis.com/tokeninfo?id_token={idToken}` to validate Google ID tokens. This simple HTTP GET approach avoids adding the entire Google API client library as a dependency. Returns `GoogleUserInfo` with `GoogleId`, `Email`, `Name`, and `Picture`.

8. **`RefreshToken` namespace collision resolution** — The command folder path `Application/Auth/Commands/RefreshToken/` creates a namespace that shadows the `Domain.Entities.RefreshToken` type. Resolved with `using DomainRefreshToken =` alias in the conflicting handler, and fully qualified `Domain.Entities.RefreshToken` in other handlers.

### Service Registration Pattern

Services are registered in `Program.cs` using a double-registration pattern:
```csharp
builder.Services.AddSingleton<JwtTokenService>();          // Concrete
builder.Services.AddSingleton<IJwtTokenService>(           // Interface → same instance
    sp => sp.GetRequiredService<JwtTokenService>());
```
This ensures the same singleton instance serves both `JwtTokenService` and `IJwtTokenService` injection points.

### API Endpoints

| Method | Route | Auth | Handler |
|--------|-------|------|---------|
| POST | `/api/auth/google` | None | `GoogleLoginCommandHandler` — verify Google ID token, find/create user, return JWT |
| POST | `/api/auth/email/send-otp` | None | `SendOtpCommandHandler` — generate 6-digit OTP, store in cache, log to console |
| POST | `/api/auth/email/verify-otp` | None | `VerifyOtpCommandHandler` — validate OTP, create/find user, return JWT |
| POST | `/api/auth/refresh` | None | `RefreshTokenCommandHandler` — check token valid/not revoked/not expired, revoke old, issue new |
| POST | `/api/auth/logout` | None | `RefreshTokenCommandHandler` — revoke refresh token |

### NuGet Packages Added
- `Microsoft.IdentityModel.Tokens` 8.15.0 — JWT signing and validation
- `System.IdentityModel.Tokens.Jwt` 8.15.0 — JWT handler
- `FluentValidation` 12.0.0 — Request validation
- `FluentValidation.AspNetCore` 11.3.1 — ASP.NET integration
- `Serilog` 4.2.0 — Structured logging

### Verification
```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/RevisionAI.Api --launch-profile http
curl -X POST http://localhost:5242/api/auth/email/send-otp -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
# → 200, OTP logged: [DEV OTP] OTP for test@example.com: 123456
curl -X POST http://localhost:5242/api/auth/email/verify-otp -H "Content-Type: application/json" -d '{"email":"test@example.com","otp":"123456"}'
# → 200 with AuthResponse (accessToken, refreshToken, expiresAt, user)
```


---

## 15. PHASE 1.1 IMPLEMENTATION NOTES

### TOC Extraction — PyMuPDF + Gemini Vision

Extracted chapter names and page ranges from 20 medical subject PDFs (19 subjects + 1 PYQ) using an agentic IDE approach with Antigravity + Gemini 3.1 Pro Vision.

### Key Implementation Decisions

1. **Agentic IDE (Antigravity) over Python script pipeline** — Phase 1.1 is a one-time extraction task. Writing, debugging, and maintaining a Python script for a single run would add ~2 hours of overhead. Antigravity has PyMuPDF built-in and Gemini Vision natively — it can iterate across 20 files in a single conversation without external dependencies.

2. **100% vision-based extraction** — Indian medical PDFs (Marrow Edition 8) have corrupt embedded text layers from machine OCR on scanned pages. `page.get_text()` returns garbled Unicode. Every contents page is rendered to 150 DPI PNG and read by Gemini 3.1 Pro Vision. Zero reliance on PDF text layers.

3. **Built-in Gemini over external API** — Antigravity's built-in Gemini 3.1 Pro can read images directly in the chat. Avoiding external API calls eliminated credential management, reduced cost to $0, and simplified the workflow.

4. **Per-subject TOC JSON files** — 20 separate `toc_{subject}.json` files rather than a single monolithic file. Easier to diff, validate, and use as independent inputs for Phase 1.2 (PDF Slicer).

5. **PYQ handled as exams, not chapters** — The Previous Years PDF contains questions grouped by exam (AIIMS 2017, NEET PG 2019, etc.), not by chapter. The TOC structure reflects this: exam names + start pages instead of chapter title + page ranges.

### Output Structure
```
pipeline/output/{subject}/toc.json
pipeline/output/{subject}/contents_pages/   (rendered PNGs)

toc.json format:
{
  "subject": "Anaesthesia",
  "sourcePdf": "Subject wise/Anaesthesia_ed8.pdf",
  "chapters": [
    { "title": "...", "chapterNumber": 1, "startPage": 1, "estimatedEndPage": 8 }
  ]
}
```

### Verification
- 20 subjects, 829 chapters extracted
- 0 issues after fixing last-chapter end-page bug
- Python validation script checks page number sequentiality, last chapter boundaries, required fields

### Key Bug: Last Chapter estimatedEndPage
The initial extraction set `estimatedEndPage == startPage` for every subject's last chapter. The "next chapter startPage - 1" formula has no next chapter for the final chapter. Fixed by using `doc.page_count` from PyMuPDF as the final chapter's end boundary.


---

## 16. PHASE 1.2+1.3 IMPLEMENTATION NOTES

### Streaming Extraction Pipeline — Y-Coordinate Interleaving + Gemini Vision

Merged PDF slicing, page rendering, and vision parsing into a single streaming pipeline. Pages rendered in RAM, streamed to Gemini 3.1 Pro Vision, and discarded — only final JSON + image assets persist to disk (~55 MB per subject vs ~4.5 GB in the original sequential plan).

### Key Implementation Decisions

1. **Merge Phase 1.2+1.3 into streaming pipeline** — The original plan called for sequential phases: slice PDFs → render PNGs to disk → parse PNGs with vision AI. This would have stored ~4.5 GB of intermediate artifacts. The merged approach renders pages in RAM, sends them directly to Gemini Vision, and discards them. Only `chapter_N_questions.json` + extracted image assets persist.

2. **Y-coordinate interleaving for deterministic image anchoring** — `extract_interleaved.py` uses PyMuPDF to find exact (X, Y) bounding box coordinates for every text block and image on a page. Sorting strictly by Y-coordinate produces a timeline where images are mathematically positioned relative to text. This replaces probabilistic AI spatial reasoning with deterministic math — zero cross-page image misassignment.

3. **5-stage schema evolution** — The question JSON format evolved through 5 iterations: from flat `optionA`-`optionD` with bare `questionAssets[]` strings → to `options: {a, b, c, d}` with structured `media[]` objects containing `mediaType`, `description`, `filename`, and `pageNumber`. `fix_schema.py` auto-normalizes all formats to the target.

4. **`hasMedia`/`explanationHasMedia` pattern** — Boolean flags determine whether to include `media[]` or `explanationMedia[]` arrays. When false, both the flag and array are omitted entirely. When true, media objects contain typed metadata (`ClinicalImage`, `Diagram`, `Table`) enabling the frontend to render appropriately.

5. **Semantic asset filenames** — `img_{pageNumber}_{q|e}{questionNumber}_{index}.jpeg` convention. Example: `img_348_q1_1.jpeg` = Page 348, Question 1, Image 1. `img_354_e1_1.jpeg` = Page 354, Explanation 1, Image 1. Instantly traceable to source.

6. **Tables as inline Markdown** — Tables are converted to Markdown format and placed directly within the `explanation` string. Separating tables as image assets would lose searchability and add rendering latency. Complex tables that can't be rendered in Markdown are extracted as image assets.

7. **Drop `difficulty` field** — AI cannot reliably judge question difficulty from text alone. Difficulty is populated from analytics (Phase 2) using student pass rates and time data.

8. **Dual-path execution strategy** — Pipeline-SOP.md defines two paths: (A) Antigravity native vision for prototyping (~25 chapters/day, zero API cost, rate-limited), (B) Gemini API via `google-genai` SDK for production scale (1,500 requests/day free tier, throttled at 4 seconds between calls).

### Pipeline Scripts Created

| Script | Purpose |
|--------|---------|
| `extract_interleaved.py` | PyMuPDF bounding box extraction + Y-coordinate interleaved timeline generation |
| `fix_schema.py` | Auto-normalizes 5 schema versions to unified target |
| `validator.py` | 10 validation checks per question + audit report generation |

### Output Structure
```
pipeline/output/anaesthesia/
├── chapter_19/
│   ├── chapter_19_questions.json
│   └── assets/img_348_q1_1.jpeg, img_354_e1_1.jpeg, ...
├── chapter_22/
│   ├── chapter_22_questions.json
│   └── assets/...
└── audit_report.json + audit_summary.md
```

### Verification
- Anaesthesia: 25 chapters, 551 questions extracted
- 534/551 pass validation (96.9%)
- Total disk usage: ~55 MB (vs ~4.5 GB in original plan)
- Zero cross-page image anchoring errors after Y-coordinate interleaving

---

## 17. PHASE 2.1: QUESTIONS API IMPLEMENTATION NOTES

**Date:** June 6, 2026
**Status:** ✅ Complete

### 17.1 Architecture Pattern: CQRS with MediatR

All 5 endpoints follow the same CQRS pattern established in Phase 0.3:

```
Controller (Api layer)
  → IMediator.Send(Query)
    → QueryHandler (Application layer)
      → IAppDbContext (Infrastructure layer)
        → PostgreSQL
```

Controllers inject `IMediator`, create a Query object, send it, and map the response to HTTP status codes. Handlers use `IAppDbContext` with `AsNoTracking()` and `.Select()` projection — no entities are ever returned to the API surface.

### 17.2 DTO Design

| DTO | Used By | Includes |
|-----|---------|----------|
| `SubjectDto` | `GET /api/subjects` | id, name, slug, iconName, questionCount |
| `ChapterDto` | `GET /api/subjects/{slug}/chapters` | id, chapterNumber, title, startPage, endPage, questionCount |
| `QuestionDto` | `GET /api/questions` (list) | id, questionNumber, questionText, options(A/B/C/D), hasMedia, sourcePage, subjectName, chapterTitle — **NO CorrectOption, NO Explanation** |
| `QuestionDetailDto` | `GET /api/questions/{id}` (detail) | All of QuestionDto + CorrectOption, Explanation, Media[] |
| `MediaDto` | Detail + media endpoints | id, mediaType, description, blobUrl, pageNumber |
| `MetaDto` | Paginated responses | page, pageSize, totalCount, hasNext |

**Design principle:** The list endpoint deliberately omits `CorrectOption` and `Explanation` to prevent answer leakage when students browse questions. Only the single-question detail endpoint reveals the answer.

### 17.3 Pagination Strategy

```csharp
int page = Math.Max(1, request.Page);
int pageSize = Math.Clamp(request.PageSize, 1, 100);
int totalCount = await query.CountAsync(cancellationToken);
List<QuestionDto> questions = await query
    .OrderBy(q => q.QuestionNumber)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(...)
    .ToListAsync(cancellationToken);
```

- Count is computed BEFORE pagination for accurate metadata
- Page is floored at 1, pageSize is clamped to [1, 100]
- Ordering by `QuestionNumber` ensures consistent pagination

### 17.4 404 Handling Pattern

Handlers that can return "not found" use nullable response types:

```csharp
// Handler returns IRequest<TResponse?> — nullable for 404 cases
public class GetSubjectChaptersQuery : IRequest<GetSubjectChaptersResponse?> { ... }
public class GetQuestionsQuery : IRequest<GetQuestionsResponse?> { ... }
public class GetQuestionDetailQuery : IRequest<GetQuestionDetailResponse?> { ... }

// Handler: return null when entity not found
if (subject is null) return null;

// Controller: check null and return 404
if (result is null) return NotFound();
```

This avoids throwing exceptions for normal control flow and keeps handlers as pure data fetchers.

### 17.5 Files Created (22 total)

```
Application/Subjects/Queries/GetSubjects/
├── SubjectDto.cs
├── GetSubjectsResponse.cs
├── GetSubjectsQuery.cs
└── GetSubjectsQueryHandler.cs

Application/Subjects/Queries/GetSubjectChapters/
├── ChapterDto.cs
├── GetSubjectChaptersResponse.cs
├── GetSubjectChaptersQuery.cs
└── GetSubjectChaptersQueryHandler.cs

Application/Questions/Queries/GetQuestions/
├── QuestionDto.cs
├── GetQuestionsResponse.cs
├── GetQuestionsQuery.cs
└── GetQuestionsQueryHandler.cs

Application/Questions/Queries/GetQuestionDetail/
├── QuestionDetailDto.cs
├── MediaDto.cs
├── GetQuestionDetailResponse.cs
├── GetQuestionDetailQuery.cs
├── GetQuestionDetailQueryHandler.cs
├── GetQuestionMediaResponse.cs
├── GetQuestionMediaQuery.cs
└── GetQuestionMediaQueryHandler.cs

Api/Controllers/
├── SubjectsController.cs
└── QuestionsController.cs
```

### 17.6 Conventions Enforced

- **Explicit types:** No `var` usage — project enforces `csharp_style_var_elsewhere = false` with `TreatWarningsAsErrors`
- **Slug matching:** Direct comparison (no `.ToLower()`) since DB stores slugs lowercase from Phase 1.5 seeding
- **`AsNoTracking()`:** All read queries use it for performance
- **`.Select()` projection:** No entity materialization — DTOs are projected directly in SQL
- **0 errors, 0 warnings:** `dotnet build` passes clean

---

*This document will be updated as architectural decisions are made during implementation.*
