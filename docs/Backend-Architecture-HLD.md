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

### 1.4 Hourly Questions (Phase 2.2) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | `/api/hourly-questions` | JWT | — | `{ data: [{ pendingQuestionId, expiresAt, question: QuestionWithoutAnswersDto }] }` | Unanswered, unexpired pending questions ordered by CreatedAt ASC (oldest first). Hides CorrectOption + Explanation. |
| POST | `/api/hourly-questions/{id:guid}/answer` | JWT | `{ selectedOption: "B" }` | `{ isCorrect, correctOption, explanation }` | Submit answer. Validates ownership, not expired, not already answered. Creates UserAttempt (SessionType="Hourly"). Returns correctness + answer. |
| GET | `/api/hourly-questions/history` | JWT | `?page=1&pageSize=20` | `{ data: [{ pendingQuestionId, expiresAt, isAnswered, answeredAt, userAnswer, question }], meta }` | Paginated history of answered + expired questions. Ordered by CreatedAt DESC. Hides CorrectOption + Explanation from embedded question. |

**Scheduler:** `HourlyQuestionService` (BackgroundService) — runs every hour on the hour via `PeriodicTimer`. Delivers 2 uniform random questions to all users with `LastLoginAt` within 7 days. 48-question queue cap per user. 24-hour expiry. Excludes already-attempted and already-pending questions. Uses `IServiceScopeFactory` to create scoped `IAppDbContext`.

**Implementation:** `HourlyQuestionsController.cs` with 3 endpoints injecting `IMediator`. Uses CQRS pattern: `GetPendingQuestionsQuery` (filters by UserId, IsAnswered=false, ExpiresAt>now), `AnswerQuestionCommand` (validates ownership/expiry/not-answered inline, creates UserAttempt), `GetHourlyHistoryQuery` (joined with UserAttempts on (UserId, QuestionId, SessionType="Hourly")). All queries use `AsNoTracking()` + `.Select()` projection. QuestionWithoutAnswersDto excludes CorrectOption + Explanation. AnswerQuestionResponse includes both. `User.LastLoginAt` added to domain — set on Google OAuth + Email OTP login. Migration: `20260607020510_AddUserLastLoginAt`.

**DTOs:** `PendingQuestionDto` (pendingQuestionId, expiresAt, QuestionWithoutAnswersDto), `QuestionWithoutAnswersDto` (all question fields EXCEPT CorrectOption, Explanation), `AnswerQuestionResponse` (isCorrect, correctOption, explanation), `HourlyHistoryDto` (pendingQuestionId, expiresAt, isAnswered, answeredAt, userAnswer, QuestionWithoutAnswersDto), `MetaDto` (page, pageSize, totalCount, hasNext — shared with GetQuestions namespace).

### 1.5 Mocks (Phase 2.3) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| POST | `/api/mocks/generate` | JWT | `{ subjectIds: Guid[], questionCount: int, timeLimitMinutes?: int }` | `{ mockSessionId, totalQuestions, timeLimitMinutes, questions: MockQuestionDto[] }` | Random selection from subjects, creates session + answers. Questions hide CorrectOption + Explanation. |
| GET | `/api/mocks/{id:guid}` | JWT | — | `{ mockSessionId, config, totalQuestions, timeLimitMinutes, startedAt, isCompleted, score, questions: MockQuestionDto[] }` | Session view. Validates ownership (404 if not owner). Questions hide answers. |
| POST | `/api/mocks/{mockSessionId:guid}/answers` | JWT | `{ answers: [{ questionId, displayOrder, selectedOption: char, timeTakenMs }] }` | `{ results: [{ questionId, displayOrder, isCorrect, correctOption, explanation }] }` | Batch validate + check correctness + create UserAttempts (SessionType="Mock"). Increments score. Reveals answers. |
| POST | `/api/mocks/{id:guid}/complete` | JWT | — | `{ mockSessionId, totalQuestions, answeredCount, correctCount, skippedCount, score, timeTakenSeconds }` | Finalize session, compute stats. Unanswered rows = skipped. |
| GET | `/api/mocks/{id:guid}/results` | JWT | — | `{ mockSessionId, totalQuestions, correctCount, incorrectCount, skippedCount, score, timeTakenSeconds, questions: MockResultQuestionDto[] }` | Full breakdown with student + correct answers. Only after completion (400 if not). |
| GET | `/api/mocks/history` | JWT | `?page=1&pageSize=20` | `{ data: MockHistoryDto[], meta: { page, pageSize, totalCount, hasNext } }` | Paginated completed sessions. Ordered by CompletedAt DESC. |
| POST | `/api/mocks/generate/retake-incorrect` | JWT | `{ previousMockSessionId: Guid }` | `{ mockSessionId, totalQuestions, questions: MockQuestionDto[] }` | New mock from previous session's incorrect answers (IsCorrect==false). |

**Implementation:** `MocksController.cs` with 7 endpoints injecting `IMediator`. Uses CQRS pattern: `GenerateMockCommandHandler` (random selection via `OrderBy(_ => Guid.NewGuid())`, creates MockSession + MockSessionAnswer rows), `GetMockSessionQueryHandler` (validate ownership, return null for 404), `SubmitMockAnswersCommandHandler` (inline validation, char.ToUpperInvariant comparison, batch UserAttempt creation, score increment), `CompleteMockCommandHandler` (set CompletedAt, recount stats), `GetMockResultsQueryHandler` (requires completion, returns full breakdown), `GetMockHistoryQueryHandler` (paginated, CompletedAt DESC, imports MetaDto from GetQuestions), `RetakeIncorrectCommandHandler` (finds IsCorrect==false rows, creates new session). No migrations needed — `MockSession` and `MockSessionAnswer` entities from Phase 0.2. `MockConfig` stored as JSON string in jsonb column. Score initialized to 0, incremented on submit, recalculated on complete for idempotency.

**DTOs:** `MockQuestionDto` (displayOrder, questionId, questionText, optionA-D — no answers), `AnswerResultDto` (questionId, displayOrder, isCorrect, correctOption, explanation), `CompleteMockResponse` (stats), `MockResultQuestionDto` (full breakdown with student answer), `MockHistoryDto` (summary). `MetaDto` imported from `Application.Questions.Queries.GetQuestions`.

### 1.6 Reviews / Spaced Repetition (Phase 2.4) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | `/api/spaced-repetition/due` | JWT | `?page=1&pageSize=20` | `{ data: [DueQuestionDto], meta: { page, pageSize, totalCount, hasNext } }` | Paginated due questions ordered by NextReviewDate ASC. Question DTO hides CorrectOption + Explanation. |
| POST | `/api/spaced-repetition/{questionId}/review` | JWT | `{ selectedOption: char, timeTakenMs: int }` | `{ isCorrect, correctOption, explanation, newEaseFactor, newInterval, nextReviewDate }` | Review via SM-2 algorithm. Creates/updates QuestionSchedule + UserAttempt (SessionType="SpacedRepetition"). Reveals answer after submission. |
| GET | `/api/spaced-repetition/stats` | JWT | — | `{ totalScheduled, dueToday, averageEaseFactor, totalReviews }` | Aggregate SR statistics for current user. |

**Implementation:** `SpacedRepetitionController.cs` with 3 endpoints. SM-2 algorithm in `Infrastructure/Services/Sm2Service.cs`: EaseFactor 1.3–3.0, Interval 1–365 days. DTOs imported from HourlyQuestions (QuestionWithoutAnswersDto) and GetQuestions (MetaDto).

### 1.7 Analysis (Phase 2.5) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| POST | `/api/analysis/batch` | JWT | `{ questionIds: Guid[] }` | `{ totalQuestions, correctCount, incorrectCount, accuracyPercentage, averageTimeMs }` | Combined stats for specific questions. Validates IDs not empty (400) and all exist (400). |
| GET | `/api/analysis/dashboard` | JWT | — | `{ totalQuestionsAnswered, totalCorrect, totalIncorrect, overallAccuracy, streakDays, totalXp, currentLevel, weakestSubject, strongestSubject }` | Full dashboard. Stats from all SessionTypes. Streak/XP default 0. Subject accuracy via GroupBy. |
| GET | `/api/analysis/question/{id:guid}/history` | JWT | — | `{ questionText, currentEaseFactor, currentInterval, attempts: [{ sessionType, selectedOption, isCorrect, timeTakenMs, createdAt }] }` | Per-question attempt timeline ordered ASC. Empty attempts[] if none (not 404). Reads QuestionSchedule for SR state. |

**Implementation:** `AnalysisController.cs` with 3 endpoints injecting `IMediator`. Uses CQRS pattern: `AnalyzeBatchCommandHandler` (validates questionIds + aggregates UserAttempts), `GetDashboardQueryHandler` (reads all SessionTypes, joins Question.Subject for per-subject accuracy, reads UserStreak/UserXp with default 0), `GetQuestionHistoryQueryHandler` (reads Question text + QuestionSchedule + ordered UserAttempts). All queries use `AsNoTracking()` + `.Select()` projection. No new entities or migrations — uses existing `UserAttempt`, `QuestionSchedule`, `UserStreak`, `UserXp`. `ValidationException` thrown for invalid question IDs, caught by middleware → 400. `AttemptDto` and `SubjectAccuracyDto` are self-contained nested DTOs.

### 1.8 Bookmarks (Phase 2.6) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| POST | `/api/bookmarks/collections` | JWT | `{ name, icon? }` | `BookmarkCollectionDto` | Create a named bookmark collection with optional icon |
| GET | `/api/bookmarks/collections` | JWT | — | `[BookmarkCollectionDto]` | List user's collections with item counts |
| POST | `/api/bookmarks/collections/{id:guid}/items` | JWT | `{ questionId }` | `BookmarkItemDto` | Add question to collection. 400 on duplicate (unique constraint). 404 if collection not found or not owner. |
| DELETE | `/api/bookmarks/collections/{id:guid}/items/{questionId:guid}` | JWT | — | `204 No Content` | Remove question from collection. 404 if item not found. |
| GET | `/api/bookmarks/collections/{id:guid}/items` | JWT | `?page=1&pageSize=20` | `{ data: [QuestionDto], meta: MetaDto }` | Paginated questions in collection. Hides CorrectOption + Explanation via QuestionDto reuse. |

**Implementation:** `BookmarksController.cs` with 5 endpoints injecting `IMediator`. Uses CQRS: `CreateCollectionCommandHandler` (creates BookmarkCollection with UserId, returns DTO), `GetCollectionsQueryHandler` (AsNoTracking + Select with c.Items.Count projection), `AddBookmarkItemCommandHandler` (validates collection ownership AND question existence, explicit AnyAsync duplicate check + DbUpdateException catch for PostgreSQL), `RemoveBookmarkItemCommandHandler` (verify collection ownership, find by CollectionId+QuestionId, Remove), `GetCollectionItemsQueryHandler` (verify collection ownership, paginated BookmarkItems joined to Questions, imports QuestionDto and MetaDto from GetQuestions). All queries use AsNoTracking + Select projection. Duplicate prevention is dual-layer: explicit existence check for InMemory reliability + unique constraint catch for PostgreSQL production.

**DTOs:** `BookmarkCollectionDto` (id, name, icon, itemCount, createdAt), `BookmarkItemDto` (id, questionId, questionText, createdAt), `QuestionDto` and `MetaDto` imported from `Application.Questions.Queries.GetQuestions`.

### 1.9 Notes (Phase 2.6) ✅ COMPLETE

| Method | Endpoint | Auth | Params/Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| POST | `/api/notes` | JWT | Multipart: `file` + query params `questionId?`, `topicId?`, `noteType?` | `NoteDto` | Upload note image (PNG/JPEG/WebP only, max 10MB). Saves via INoteStorageService. |
| GET | `/api/notes` | JWT | `?questionId=X` or `?topicId=Y` | `[NoteDto]` | Get notes for a question or topic. 200 with empty array if none found. |
| DELETE | `/api/notes/{id:guid}` | JWT | — | `204 No Content` | Delete note with ownership validation. Deletes from blob storage then DB. 404 if not found or not owner. |

**Implementation:** `NotesController.cs` with 3 endpoints injecting `IMediator`. Uses `[RequestSizeLimit(10MB)]` on controller. `CreateNoteCommandHandler`: validates file size ≤10MB, checks MIME type against allowed set (image/png, image/jpeg, image/webp), generates unique filename via Guid+extension, saves to INoteStorageService, creates UserNote entity. `GetNotesQueryHandler`: AsNoTracking + Where(UserId) with optional QuestionId/TopicId filters, Select projection to NoteDto. `DeleteNoteCommandHandler`: verifies ownership (note.UserId == request.UserId), deletes from storage first, then removes from DB.

**Service:** `INoteStorageService` — abstraction for blob/file storage with `SaveAsync(Stream, fileName, contentType)` and `DeleteAsync(blobUrl)`. Dev implementation: `LocalNoteStorageService` saves to `wwwroot/uploads/notes/`. Registered as singleton in Program.cs.

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

### Phase 2.1 (Questions API): ✅ Complete
- 5 API endpoints (subjects list, chapters, questions list + detail + media)
- 22 files across Application and Api layers
- Pagination, filtering, answer hiding, 404 patterns

### Phase 2.2 (Hourly Question Engine): ✅ Complete
- 3 API endpoints + 1 BackgroundService (HourlyQuestionService)
- 19 new files, LastLoginAt migration
- Uniform question delivery, 48 queue cap, 24hr expiry

### Phase 2.3 (Custom Mock Engine): ✅ Complete
- 7 API endpoints, 27 new files, 1 modified (IAppDbContext)
- Random question selection, batch answer submission, score lifecycle
- MockConfig as JSONB, DTO reuse, UserAttempt integration
- 6/14 xUnit integration tests passing (InMemory limitation)

### Phase 0.1 (Project Scaffold): ✅ Complete
- .NET 10 solution with 5 Clean Architecture projects
- NuGet packages: MediatR, EF Core, Npgsql, Serilog, Swagger
- 0 build errors, 0 warnings

### Phase 0.2 (Database Schema): ✅ Complete
- 20 entities, 20 Fluent API configurations, InitialCreate migration
- 21 tables, 60+ indexes, 40+ foreign keys
- 19 medical subjects seeded (6 seeded with data)

### Phase 0.3 (Authentication): ✅ Complete
- 5 auth endpoints, 4 MediatR commands/handlers
- JWT Bearer middleware, Google OAuth, Email OTP
- Verified: send-otp, verify-otp, refresh, logout

---

*This document will be updated as APIs are built in Phase 2.*
