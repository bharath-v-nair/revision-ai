# RevisionAI — Backend Architecture High-Level Design

**Version:** 1.0
**Date:** June 3, 2026

---

## 1. API ENDPOINTS INVENTORY

### 1.1 Authentication (Phase 0.3) ✅ COMPLETE

| Method | Endpoint | Auth | Request | Response | Description | Status |
|--------|----------|------|---------|----------|-------------|--------|
| POST | `/api/auth/google` | None | `{ idToken: string }` | `AuthResponse` | Google OAuth login | ✅ Built |
| POST | `/api/auth/email/send-otp` | None | `{ email: string }` | `200 OK` | Send OTP to email | ✅ Built |
| POST | `/api/auth/email/verify-otp` | None | `{ email: string, otp: string }` | `AuthResponse` | Verify OTP & login | ✅ Built |
| POST | `/api/auth/refresh` | None | `{ refreshToken: string }` | `AuthResponse` | Refresh access token | ✅ Built |
| POST | `/api/auth/logout` | None | `{ refreshToken: string }` | `200 OK` | Revoke refresh token | ✅ Built |

**Implementation:** `AuthController.cs` with 4 MediatR commands (GoogleLogin, SendOtp, VerifyOtp, RefreshToken). JWT Bearer middleware configured with HS256, 15-min access tokens, 7-day refresh tokens with rotation.

### 1.2 Questions (Phase 2.1) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | `/api/questions` | None | `?subjectSlug={slug}&chapterNumber={n}&page=1&pageSize=20` | `{ data: [QuestionDto], meta: { page, pageSize, totalCount, hasNext } }` | Paginated question list. Hides CorrectOption + Explanation. |
| GET | `/api/questions/{id:guid}` | None | — | `{ data: QuestionDetailDto }` | Full question detail (includes CorrectOption, Explanation, Media[]) |
| GET | `/api/questions/{id:guid}/media` | None | — | `{ data: [MediaDto] }` | Linked media references for a question |

**Implementation:** `QuestionsController.cs` with 3 endpoints injecting `IMediator`. Uses CQRS pattern: `GetQuestionsQuery` (paginated, filters by subjectSlug + optional chapterNumber, max 100 per page), `GetQuestionDetailQuery` (uses `.Select()` projection with Included media), `GetQuestionMediaQuery` (returns media list or null for 404). All queries use `AsNoTracking()`. QuestionDto excludes CorrectOption and Explanation. QuestionDetailDto includes both.

### 1.3 Subjects & Chapters (Phase 2.1) ✅ COMPLETE

| Method | Endpoint | Auth | Params | Response | Description |
|--------|----------|------|--------|----------|-------------|
| GET | `/api/subjects` | None | — | `{ data: [SubjectDto] }` | All subjects with question counts (SubjectDto: id, name, slug, iconName, questionCount) |
| GET | `/api/subjects/{subjectSlug}/chapters` | None | — | `{ data: [ChapterDto] }` | Chapters for a subject, ordered by ChapterNumber. 404 if subject not found. (ChapterDto: id, chapterNumber, title, startPage, endPage, questionCount) |

**Implementation:** `SubjectsController.cs` with 2 endpoints injecting `IMediator`. Uses CQRS pattern: `GetSubjectsQuery` (returns all subjects with question counts via `s.Questions.Count`), `GetSubjectChaptersQuery` (finds subject by slug, returns null for 404, returns chapters with question counts). All queries use `AsNoTracking()`. SubjectSlug matching is direct comparison (slugs stored lowercase in DB).

### 1.4 Hourly Questions (Phase 2.2)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/hourly-questions` | JWT | — | Current pending questions |
| POST | `/api/hourly-questions/{id:guid}/answer` | JWT | `{ selectedOption: char }` | Submit answer |
| GET | `/api/hourly-questions/history` | JWT | `?page=1&pageSize=50` | Past answered/expired questions |

### 1.5 Mocks (Phase 2.3)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/mocks/generate` | JWT | `{ subjectIds[], topicIds[], questionCount, weightages?, difficulty? }` | Generate mock quiz |
| GET | `/api/mocks/{id:guid}` | JWT | — | Get mock session (no answers) |
| POST | `/api/mocks/{id:guid}/submit` | JWT | `{ answers: [{ questionId, selectedOption, timeTakenMs }] }` | Submit mock answers |
| GET | `/api/mocks/{id:guid}/results` | JWT | — | Mock results with per-question breakdown |
| GET | `/api/mocks/history` | JWT | `?page=1&pageSize=20` | Past mock sessions |

### 1.6 Reviews / Spaced Repetition (Phase 2.4)

| Method | Endpoint | Auth | Params | Description |
|--------|----------|------|--------|-------------|
| GET | `/api/reviews/due` | JWT | `?count=10` | Questions due for SR review |
| GET | `/api/reviews/stats` | JWT | — | SM-2 statistics |

### 1.7 Analysis (Phase 2.5)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/analysis/batch` | JWT | `{ questionIds: string[] }` | Post-5-question batch analysis |
| GET | `/api/analysis/dashboard` | JWT | — | Full dashboard metrics |
| GET | `/api/analysis/question/{id:guid}/history` | JWT | — | Per-question attempt timeline |

### 1.8 Bookmarks (Phase 2.6)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/bookmarks/collections` | JWT | `{ name, icon? }` | Create collection |
| GET | `/api/bookmarks/collections` | JWT | — | List user's collections |
| POST | `/api/bookmarks/collections/{id:guid}/items` | JWT | `{ questionId }` | Add question to collection |
| DELETE | `/api/bookmarks/collections/{id:guid}/items/{questionId}` | JWT | — | Remove from collection |
| GET | `/api/bookmarks/collections/{id:guid}/items` | JWT | — | List questions in collection |

### 1.9 Notes (Phase 2.6)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/notes` | JWT | Multipart: `file, questionId?, topicId?` | Upload note image |
| GET | `/api/notes` | JWT | `?questionId=X` or `?topicId=Y` | Get notes for question/topic |
| DELETE | `/api/notes/{id:guid}` | JWT | — | Delete note |

### 1.10 Friends (Phase 2.7)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/friends/request` | JWT | `{ email: string }` | Send friend request |
| GET | `/api/friends/requests` | JWT | — | Pending incoming requests |
| POST | `/api/friends/requests/{id:guid}/accept` | JWT | — | Accept request |
| POST | `/api/friends/requests/{id:guid}/decline` | JWT | — | Decline request |
| GET | `/api/friends` | JWT | — | List accepted friends |
| DELETE | `/api/friends/{id:guid}` | JWT | — | Unfriend |

### 1.11 Leaderboards (Phase 2.7)

| Method | Endpoint | Auth | Params | Description |
|--------|----------|------|--------|-------------|
| GET | `/api/leaderboards/friends` | JWT | — | Friends ranked by weekly XP |
| GET | `/api/leaderboards/global` | JWT | `?limit=100` | Top users by XP |
| GET | `/api/leaderboards/weekly` | JWT | `?limit=50` | Weekly top performers |
| GET | `/api/users/search` | JWT | `?q=email_or_name` | Search users |

### 1.12 Gamification (Phase 2.8)

| Method | Endpoint | Auth | Params | Description |
|--------|----------|------|--------|-------------|
| GET | `/api/gamification/profile` | JWT | — | Full gamification state |

### 1.13 AI (Phase 4)

| Method | Endpoint | Auth | Params/Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/ai/explain` | JWT | `{ questionId, level: "Beginner"|"Intermediate"|"Advanced" }` | Generate AI explanation |
| POST | `/api/ai/chat` | JWT | `{ questionId, messages: [{ role, content }] }` | Multi-turn chat |
| GET | `/api/ai/recommendations` | JWT | — | AI study recommendations |

---

## 2. SERVICE LAYER DESIGN

### 2.1 Service Inventory

```
┌────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE SERVICES                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Auth Services:                                                 │
│  ├── JwtTokenService          ── Generate & validate JWTs       │
│  ├── RefreshTokenService      ── Create, revoke, rotate tokens  │
│  ├── GoogleAuthService        ── Verify Google ID tokens        │
│  └── OtpService               ── Generate & validate OTPs       │
│                                                                 │
│  Question Services:                                             │
│  ├── QuestionSelectionStrategy ── Weighted question selection   │
│  └── HourlyQuestionService    ── Background scheduled delivery  │
│                                                                 │
│  Learning Services:                                             │
│  ├── Sm2Service               ── Spaced repetition calculation  │
│  ├── MockGenerationService    ── Mock quiz assembly             │
│  └── AnalysisService          ── Performance aggregation        │
│                                                                 │
│  Gamification Services:                                         │
│  ├── XpService                ── Award & track XP               │
│  ├── LevelService             ── Calculate level progression    │
│  ├── StreakService            ── Track daily streaks            │
│  └── AchievementService       ── Check & unlock achievements    │
│                                                                 │
│  AI Services:                                                   │
│  ├── DeepSeekExplanationService ── Generate tiered explanations│
│  └── RecommendationService    ── AI study recommendations       │
│                                                                 │
│  Infrastructure Services:                                       │
│  ├── BlobStorageService       ── Azure Blob upload/download     │
│  └── PushNotificationService  ── Web Push notifications         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Interaction Diagram (Answer Flow)

```
POST /api/hourly-questions/{id}/answer
         │
         ▼
AnswerHourlyQuestionCommandHandler
         │
         ├── (1) Validate question belongs to user, not expired
         │
         ├── (2) Check correctness → Create UserAttempt
         │
         ├── (3) Sm2Service.CalculateNextReview()
         │        ├── Map confidence → quality (0-5)
         │        ├── Apply SM-2 formula
         │        └── Upsert QuestionSchedule
         │
         ├── (4) XpService.AwardXp()
         │        ├── Calculate XP (base + streak bonus + speed bonus + confidence bonus)
         │        ├── Create XpTransaction
         │        ├── Update UserXp.TotalXp
         │        └── LevelService.CalculateLevel() → check for level-up
         │
         ├── (5) StreakService.UpdateStreak()
         │        ├── Check LastActiveDate
         │        └── Increment or reset streak
         │
         ├── (6) AchievementService.CheckAchievements()
         │        └── Check all milestone rules
         │
         └── (7) Mark PendingQuestion as answered
                  │
                  ▼
         Return: { isCorrect, correctOption, explanation, xpEarned,
                   newTotal, leveledUp, newLevel, newAchievements }
```

---

## 3. DATABASE INDEX STRATEGY (Phase 0.2 — Implemented)

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| Users | Email | UNIQUE | Auth lookup |
| Users | GoogleId | UNIQUE (filtered: IS NOT NULL) | Google OAuth lookup |
| Questions | SubjectId | BTREE | Filter by subject |
| Questions | ChapterId | BTREE | Filter by chapter |
| Questions | TopicId | BTREE | Filter by topic |
| Questions | IsPYQ | BTREE | Filter PYQ questions |
| QuestionMedia | QuestionId | BTREE | Get media for question |
| QuestionSchedules | UserId | BTREE | Get user's schedules |
| QuestionSchedules | NextReviewDate | BTREE | Get due reviews |
| QuestionSchedules | (UserId, QuestionId) | UNIQUE | One schedule per user per question |
| UserAttempts | UserId | BTREE | Get user's attempts |
| UserAttempts | CreatedAt | BTREE | Date-range queries |
| UserAttempts | (UserId, QuestionId) | COMPOSITE | Check if question attempted |
| PendingQuestions | UserId | BTREE | Get user's pending questions |
| PendingQuestions | ExpiresAt | BTREE | Expiry sweeper |
| PendingQuestions | (UserId, IsAnswered, ExpiresAt) | COMPOSITE | Get unanswered pending Qs |
| UserStreaks | UserId | UNIQUE | One streak record per user |
| UserXp | UserId | UNIQUE | One XP record per user |
| XpTransactions | UserId | BTREE | User XP history |
| XpTransactions | CreatedAt | BTREE | Date-range XP queries |
| BookmarkCollections | UserId | BTREE | Get user's collections |
| BookmarkItems | CollectionId | BTREE | Get items in collection |
| BookmarkItems | (CollectionId, QuestionId) | UNIQUE | Prevent duplicate bookmarks |
| UserNotes | UserId | BTREE | Get user's notes |
| UserNotes | QuestionId | BTREE | Notes tagged to question |
| UserNotes | TopicId | BTREE | Notes tagged to topic |
| Friendships | RequesterId | BTREE | Outgoing friend requests |
| Friendships | AddresseeId | BTREE | Incoming friend requests |
| Friendships | (RequesterId, AddresseeId) | UNIQUE | Prevent duplicate requests |
| MockSessions | UserId | BTREE | Get user's mock sessions |
| MockSessionAnswers | MockSessionId | BTREE | Get answers for mock |
| MockSessionAnswers | (MockSessionId, QuestionId) | UNIQUE | One answer per question per mock |
| RefreshTokens | Token | UNIQUE | Token lookup |
| RefreshTokens | UserId | BTREE | Get user's tokens |
| Achievements | UserId | BTREE | Get user's achievements |
| Achievements | (UserId, AchievementKey) | UNIQUE | One unlock per achievement |

---

## 4. BACKGROUND JOB SCHEDULE

| Job | Frequency | Description |
|-----|-----------|-------------|
| HourlyQuestionService | Every 60 minutes (on the hour) | Deliver 2 questions to each active user |
| ExpiredQuestionSweeper | Every 15 minutes | Mark expired PendingQuestions |
| MockAutoSubmit (future) | On mock timer expiry | Auto-submit unfinished timed mocks |
| PushNotificationJob | Triggered by HourlyQuestionService | Send push notifications |

---

## 5. ERROR HANDLING STRATEGY

### 5.1 Exception Hierarchy

```
ApiException (base)
├── NotFoundException       → 404
├── ValidationException     → 400
├── UnauthorizedException   → 401
├── ForbiddenException      → 403
├── ConflictException       → 409
└── TooManyRequestsException → 429
```

### 5.2 Global Exception Middleware

```csharp
// Catches all unhandled exceptions
// Maps ApiException subclasses to HTTP status codes
// Logs to Serilog with correlation ID
// Returns ProblemDetails JSON in production
// Returns developer exception page in development
```

---

## 6. CONFIGURATION MANAGEMENT

### 6.1 Configuration Sources (Priority Order)

1. Azure Key Vault (production)
2. Environment variables
3. appsettings.Production.json
4. appsettings.Development.json
5. appsettings.json

### 6.2 Key Configuration Keys

```json
{
  "Jwt": {
    "Key": "32+ char secret",
    "Issuer": "RevisionAI",
    "Audience": "RevisionAI",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "Google": {
    "ClientId": "xxx.apps.googleusercontent.com"
  },
  "DeepSeek": {
    "ApiKey": "sk-xxx",
    "BaseUrl": "https://api.deepseek.com/v1"
  },
  "Azure": {
    "BlobStorage": {
      "ConnectionString": "...",
      "ContainerName": "revisionai-media"
    },
    "KeyVault": {
      "Uri": "https://revisionai-kv.vault.azure.net/"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=revisionai;Username=revisionai;Password=devpassword"
  }
}
```

---

## 7. RATE LIMITING (Phase 5.3)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/email/send-otp` | 5 | Per 5 minutes per IP |
| `/api/auth/email/verify-otp` | 5 | Per 5 minutes per IP |
| `/api/ai/explain` | 30 | Per minute per user |
| `/api/ai/chat` | 20 | Per minute per user |
| All other endpoints | 300 | Per minute per user |

---

## 8. CACHING STRATEGY

| Data | Cache | TTL | Reason |
|------|-------|-----|--------|
| Subjects list | In-Memory | 24 hours | Rarely changes |
| AI Explanations | DB (persisted) | Permanent | Never re-generate same Q+level |
| AI Recommendations | In-Memory | 24 hours | Per-user, daily refresh |
| OTP codes | IMemoryCache | 5 minutes | Security-sensitive |
| Question data | None (direct DB) | — | Questions can change; always fresh |

---

---

## 9. SERVICE INVENTORY

| Service | Layer | Interface | Purpose |
|---------|-------|-----------|---------|
| `JwtTokenService` | Infrastructure | `IJwtTokenService` | HS256 JWT generation (15-min access tokens) |
| `RefreshTokenService` | Infrastructure | `IRefreshTokenService` | Cryptographic random refresh token generation (7-day) |
| `GoogleAuthService` | Infrastructure | `IGoogleAuthService` | Google ID token validation via tokeninfo endpoint |
| `OtpService` | Infrastructure | `IOtpService` | 6-digit OTP generation, IMemoryCache storage with 5-min sliding expiry |
| `AppDbContext` | Infrastructure | `IAppDbContext` | EF Core PostgreSQL data access (20 DbSets) |

All services follow Clean Architecture: interfaces defined in Application layer, implementations in Infrastructure.

---

## 10. PHASE STATUS

### Phase 0.1 (Project Scaffold): ✅ Complete
- .NET 10 solution with 5 Clean Architecture projects created
- NuGet packages: MediatR 14.1, EF Core 10, Npgsql, BCrypt, Serilog, Swagger, JWT Bearer, Azure Blob
- `dotnet build` succeeds with 0 errors, 0 warnings

### Phase 0.2 (Database Schema): ✅ Complete
- 20 entities, 20 Fluent API configurations, InitialCreate migration
- 21 tables, 60+ indexes, 40+ foreign keys
- 19 medical subjects seeded

### Phase 0.3 (Authentication): ✅ Complete
- 5 auth endpoints, 4 MediatR commands/handlers
- JWT Bearer middleware, Google OAuth, Email OTP
- 26 new files across Contracts, Application, Infrastructure, and Api layers
- Verified: send-otp (200), verify-otp (200), refresh (200), validation errors (400)

---

*This document will be updated as APIs are built in Phase 2.*
