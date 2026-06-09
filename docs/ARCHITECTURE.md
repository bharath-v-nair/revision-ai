# RevisionAI — Architecture Document

**Version:** 2.0
**Date:** June 9, 2026

---

## 1. TECHNOLOGY STACK

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | .NET 10 |
| API | ASP.NET Core Controller APIs |
| CQRS | MediatR 12+ |
| Validation | FluentValidation |
| ORM | EF Core 10, PostgreSQL 16 |
| Auth | JWT + Refresh Tokens, Google OAuth 2.0 |
| Caching | IMemoryCache |
| Background Jobs | IHostedService / BackgroundService |
| Logging | Serilog + Application Insights |
| Testing | xUnit + Moq + FluentAssertions |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Angular 19+, standalone components |
| State | NgRx SignalStore, RxJS 7+ |
| Styling | Tailwind CSS, GSAP animations |
| Charts | Chart.js + ng2-charts |
| PWA | @angular/pwa, service worker, IndexedDB |
| Testing | Jasmine + Playwright |

### Pipeline
| Layer | Technology |
|-------|-----------|
| Language | Python 3.12+ |
| PDF | PyMuPDF (fitz) |
| AI | DeepSeek V4 Pro (Vision + Chat) |
| Storage | Azure Blob Storage |

---

## 2. CLEAN ARCHITECTURE (Backend)

```
Api → Application → Infrastructure → Domain
         ↓
     Contracts (shared DTOs)
```

- **Domain:** Pure C#. Entities, value objects. No external dependencies.
- **Application:** MediatR handlers, interfaces. References Domain + Contracts.
- **Infrastructure:** EF Core, services, external integrations. Implements Application interfaces.
- **Api:** Controllers, middleware, Program.cs. Wires everything.
- **Contracts:** DTOs, request/response models. Shared with frontend.

---

## 3. DATABASE — KEY DESIGN DECISIONS

1. **CorrectOption hidden at API level, not DB level** — Query layer decides inclusion (detail endpoint) vs exclusion (list endpoint).
2. **QuestionSchedule tracks per-user SR state** — Each (user, question) pair has independent easeFactor, interval, nextReviewDate.
3. **PendingQuestion has 24-hour expiry** — Hourly engine creates rows. Background sweeper marks expired ones.
4. **All timestamps are UTC** — Configured in DbContext.
5. **JSON column for MockConfig** — PostgreSQL JSONB for flexible mock configuration.

---

## 4. KEY DESIGN PATTERNS

### CQRS
All commands return `IRequest<T>`. All queries return `IRequest<T>`. No business logic in controllers.

### Background Services
- `HourlyQuestionService` — Runs every hour, creates 2 questions per active user
- `ExpiredQuestionSweeper` — Every 15 minutes, marks expired PendingQuestions

### Gamification Chain
Answer submitted → Sm2Service → XpService → StreakService → AchievementService → combined result

### Question Selection Strategy
Weighted priorities: 40% spaced repetition due cards | 30% weak topics | 20% unseen | 10% random discovery

---

## 5. API CONVENTIONS

| Method | Pattern | Example |
|--------|---------|---------|
| GET (list) | `/api/{resource}` | `GET /api/questions?subjectSlug=surgery&page=1` |
| GET (by id) | `/api/{resource}/{id:guid}` | `GET /api/questions/abc-123` |
| POST (create) | `/api/{resource}` | `POST /api/mocks/generate` |
| POST (action) | `/api/{resource}/{id}/{action}` | `POST /api/mocks/abc-123/submit` |
| DELETE | `/api/{resource}/{id}` | `DELETE /api/notes/abc-123` |

### HTTP Status Codes
200=Success, 201=Created, 204=Deleted, 400=Validation, 401=Unauthorized, 403=Forbidden, 404=Not Found, 409=Conflict, 500=Server Error

---

## 6. AUTHENTICATION FLOW

- **Google OAuth:** Client → Google Sign-In → POST /api/auth/google { idToken } → JWT + refresh token
- **Email OTP:** POST /api/auth/email/send-otp → OTP cached 5min → POST /api/auth/email/verify-otp → JWT tokens
- **Refresh:** POST /api/auth/refresh { refreshToken } → new accessToken (15min) + refreshToken (7d)
- **Logout:** POST /api/auth/logout → revoke refresh token

---

## 7. DATA INGESTION PIPELINE

```
Contents page → DeepSeek Vision → toc.json
PDF + toc.json → pdf_slicer → chapter PDFs
Chapter PDF → page_renderer → PNG pages (150 DPI)
PNG pages → DeepSeek Vision → chapter JSON (questions)
Chapter JSON → validator → audit report
Validated JSON → db_ingester → PostgreSQL
```

Why Vision-First: DeepSeek Vision handles layout better than OCR. Higher quality at acceptable cost.

---

## 8. TRADEOFFS

| Decision | Alternative | Why Chosen |
|----------|------------|------------|
| PostgreSQL over SQL Server | Azure SQL Database | Cheaper, pgvector, open-source |
| SM-2 over FSRS | Free Spaced Repetition Scheduler | Simpler, 85% as effective |
| Monorepo over Polyrepo | Separate repos | Solo dev. One docker compose up runs everything |
| Angular PWA over React Native | React Native + Expo | One codebase for all platforms. PWA is installable |
| Clean Architecture over N-tier | Simple 3-layer | Demonstrates dependency inversion, CQRS. Portfolio value. |

---

## 9. PERFORMANCE & SECURITY

**Performance:** Pagination on all lists. Indexed FK columns. AsNoTracking() for reads. Lazy-loaded Angular modules.
**Security:** JWT 15min expiry. Refresh token rotation. EF Core parameterized queries. CSP headers. File upload max 10MB.