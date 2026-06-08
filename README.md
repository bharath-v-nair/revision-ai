# RevisionAI 🏥

**Gamified Medical Exam Revision Platform — NEET PG / INI-CET Preparation**

*A Duolingo-style daily habit engine for medical students, with AI-powered explanations and spaced repetition.*

[![.NET 10](https://img.shields.io/badge/.NET-10-blueviolet)](https://dotnet.microsoft.com/)
[![Angular 21](https://img.shields.io/badge/Angular-21-red)](https://angular.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4)](https://azure.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## ✨ Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| 📚 **QBank Access** | ✅ | 3,461+ questions across 6 medical subjects (19 planned) |
| 🔍 **Browse & Search** | ✅ | Filter by subject, chapter. Paginated. |
| ⏰ **Hourly Question Engine** | ✅ | 2 Q/hr, 24hr expiry, 48 queue cap. BackgroundService. |
| 📝 **Custom Mock Engine** | ✅ | Random generation, batch answer, score, retake incorrect. |
| 🧠 **Spaced Repetition** | ✅ | SM-2 algorithm — daily review cards, due questions, stats. |
| 🧠 **AI Explanations** | 🔜 | 3-tier (Beginner/Int/Adv) per question |
| 📊 **Analysis Dashboard** | 🔜 | Accuracy, weak topics, activity charts |
| 🎮 **Gamification** | 🔜 | XP, Levels, Streaks, Achievements, Leagues |

---

## 🏗️ Tech Stack

### Backend
- **.NET 10** — ASP.NET Core Web API
- **Clean Architecture** — Domain → Application → Infrastructure → Api
- **MediatR + CQRS** — Command/Query separation
- **FluentValidation** — Request validation pipeline
- **Entity Framework Core 10** — PostgreSQL ORM
- **PostgreSQL 16** — Primary database (JSONB for flexible configs)
- **JWT + Refresh Tokens** — Stateless authentication
- **Google OAuth + Email OTP** — Login flows
- **Serilog** — Structured logging

### Frontend
- **Angular 21** — Standalone components
- **Tailwind CSS 4** — Utility-first styling
- **GSAP** — Animation library
- **NgRx SignalStore** — State management
- **PWA** — Installable, offline-capable

### DevOps
- **Docker + Docker Compose** — Local development
- **GitHub Actions** — CI/CD pipeline
- **Azure App Service** — Planned hosting

---

## 🚀 Quick Start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)

### 1. Start Infrastructure

```bash
cd docker
docker compose up -d
# PostgreSQL on :5432 (database=revisionai, user=revisionai, password=devpassword)
```

### 2. Run Migrations

```bash
cd backend
dotnet ef database update --project src/RevisionAI.Infrastructure --startup-project src/RevisionAI.Api
```

### 3. Seed Questions (per subject)

```bash
dotnet run --project src/RevisionAI.Api -- --seed anaesthesia
dotnet run --project src/RevisionAI.Api -- --seed dermatology
dotnet run --project src/RevisionAI.Api -- --seed psychiatry
dotnet run --project src/RevisionAI.Api -- --seed radiology
dotnet run --project src/RevisionAI.Api -- --seed forensic_medicine
dotnet run --project src/RevisionAI.Api -- --seed ophthalmology
```

### 4. Start Backend API

```bash
dotnet run --project src/RevisionAI.Api --launch-profile http
# API: http://localhost:5242
# Swagger: http://localhost:5242/swagger
```

### 5. Start Frontend

```bash
cd frontend
npm install
ng serve
# App: http://localhost:4200
```

---

## 📁 Project Structure

```
RevisionAI/
├── backend/
│   └── src/
│       ├── RevisionAI.Api/              # Controllers, Program.cs, appsettings
│       ├── RevisionAI.Application/      # MediatR handlers, CQRS, interfaces
│       ├── RevisionAI.Domain/           # Entities (pure C#, no dependencies)
│       ├── RevisionAI.Infrastructure/   # EF Core, migrations, services
│       └── RevisionAI.Contracts/        # Shared DTOs
│
├── frontend/                            # Angular 21 PWA
├── docker/docker-compose.yml            # PostgreSQL + Azurite
├── docs/
│   ├── ARCHITECTURE.md                  # Technical architecture + phase notes
│   └── Backend-Architecture-HLD.md      # API inventory + service design
└── .github/workflows/                   # CI/CD
```

---

## 🔌 API Endpoints

### Authentication (Phase 0.3)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google` | None | Google OAuth login |
| POST | `/api/auth/email/send-otp` | None | Send OTP to email |
| POST | `/api/auth/email/verify-otp` | None | Verify OTP & login |
| POST | `/api/auth/refresh` | None | Refresh access token |
| POST | `/api/auth/logout` | None | Revoke refresh token |

### Subjects & Questions (Phase 2.1)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subjects` | None | All subjects with question counts |
| GET | `/api/subjects/{slug}/chapters` | None | Chapters for a subject |
| GET | `/api/questions` | None | Paginated question list (answers hidden) |
| GET | `/api/questions/{id}` | None | Question detail (includes answer) |

### Hourly Questions (Phase 2.2)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/hourly-questions` | JWT | Unanswered pending questions |
| POST | `/api/hourly-questions/{id}/answer` | JWT | Submit answer |
| GET | `/api/hourly-questions/history` | JWT | Paginated answer history |

### Custom Mocks (Phase 2.3)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/mocks/generate` | JWT | Generate mock from subjects |
| GET | `/api/mocks/{id}` | JWT | Session view (answers hidden) |
| POST | `/api/mocks/{id}/answers` | JWT | Batch submit answers |
| POST | `/api/mocks/{id}/complete` | JWT | Finalize & compute score |
| GET | `/api/mocks/{id}/results` | JWT | Full breakdown (after completion) |
| GET | `/api/mocks/history` | JWT | Paginated history |
| POST | `/api/mocks/generate/retake-incorrect` | JWT | Retake wrong answers |

### Spaced Repetition (Phase 2.4)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/spaced-repetition/due` | JWT | Paginated due questions (answers hidden) |
| POST | `/api/spaced-repetition/{id}/review` | JWT | Review with SM-2 algorithm |
| GET | `/api/spaced-repetition/stats` | JWT | Aggregate SR statistics |

---

## 🧪 Running Tests

```bash
cd backend
dotnet build                        # 0 errors, 0 warnings
dotnet test                         # Run all tests
dotnet test --filter "MockEngine"   # Run specific test class
```

---

## 📊 Database

3,461 questions seeded across 6 subjects:

| Subject | Questions | Chapters |
|---------|-----------|----------|
| Anaesthesia | 551 | 25 |
| Dermatology | 510 | 23 |
| Forensic Medicine | 436 | 21 |
| Ophthalmology | 634 | 27 |
| Psychiatry | 434 | 33 |
| Radiology | 332 | 15 |

---

## 📈 Status

| Phase | Feature | Status |
|-------|---------|--------|
| 0.1 | Project Scaffold | ✅ |
| 0.2 | Database Schema (20 tables) | ✅ |
| 0.3 | Authentication (5 endpoints) | ✅ |
| 1.1-1.5 | Data Pipeline + Seeding | ✅ |
| 2.1 | Questions API | ✅ |
| 2.2 | Hourly Question Engine | ✅ |
| 2.3 | Custom Mock Engine | ✅ |
| 2.4 | Spaced Repetition Engine | ✅ |
| 2.5 | Analysis Engine | 🔜 |
| 2.6 | Bookmarks & Notes | 🔜 |
| 2.7 | Social (Friends + Leaderboards) | 🔜 |
| 2.8 | Gamification | 🔜 |

---

## 👤 Author

Built as a portfolio project demonstrating Clean Architecture, CQRS, and full-stack .NET + Angular development for senior backend engineering roles.

---

## 📄 License

MIT — See [LICENSE](./LICENSE) file.