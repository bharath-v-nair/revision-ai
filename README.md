# RevisionAI 🏥

**Gamified Medical Exam Revision Platform**

*Duolingo + Anki + Medical QBank + AI Tutor — in a single ecosystem.*

[![Build Status](https://img.shields.io/badge/build-in%20progress-yellow)](https://github.com)
[![.NET 10](https://img.shields.io/badge/.NET-10-blueviolet)](https://dotnet.microsoft.com/)
[![Angular 21](https://img.shields.io/badge/Angular-21-red)](https://angular.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4)](https://azure.microsoft.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## 🎯 What is RevisionAI?

RevisionAI transforms medical exam preparation (NEET PG / INI-CET) from boring QBank practice into an addictive, gamified daily habit. Every hour, 2 personalized questions arrive. Answer them. Build a streak. Level up. The platform never lets you wonder "what should I study now?"

**The problem:** Medical students have access to content but procrastinate with social media and mobile games.

**The solution:** RevisionAI gives them the same dopamine hits — but from studying.

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| ⏰ **Hourly Question Drop** | 2 personalized questions every hour. 24-hour expiry. No decision fatigue. |
| 🧠 **Spaced Repetition (SM-2)** | Each question's review schedule adapts to your performance. |
| 🎮 **Gamification** | XP, Levels, Streaks, Achievements. Every correct answer feels like a win. |
| 🤖 **AI Tutor** | Beginner / Intermediate / Advanced explanations. Chat with AI to clarify doubts. |
| 📊 **Analysis & Insights** | After every 5 questions: accuracy, strong/weak topics, personalized recommendations. |
| 📝 **Custom Mocks** | Build quizzes by subject, topic, weightage. Timed or untimed. |
| 🔖 **Bookmarks & Notes** | Save questions to collections. Upload handwritten/digital notes. |
| 👥 **Friends & Leaderboards** | Compete with friends. No chat (just accountability). |
| 📱 **PWA (Installable)** | "Add to Home Screen." Full-screen app experience on Android. |
| 🌙 **Dark Mode** | Light/Dark/System preference. |

---

## 🏗️ Tech Stack

### Backend
- **.NET 10** — ASP.NET Core Web API
- **Clean Architecture** — Domain → Application → Infrastructure → API
- **MediatR** — CQRS pattern
- **FluentValidation** — Request validation
- **Entity Framework Core 10** — PostgreSQL ORM
- **PostgreSQL 16** — Primary database (+ pgvector for future vector search)
- **JWT + Refresh Tokens** — Authentication
- **Google OAuth + Email OTP** — Login
- **Serilog + Application Insights** — Logging & telemetry
- **BackgroundService** — Scheduled job infrastructure

### Frontend
- **Angular 21** — Standalone components
- **Tailwind CSS** — Utility-first styling
- **GSAP** — Professional animations
- **NgRx SignalStore** — State management
- **Chart.js** — Analytics charts
- **PWA** — Installable, offline-capable

### Data Pipeline
- **Python 3.12+** — Ingestion scripts
- **PyMuPDF** — PDF processing
- **DeepSeek V4 Pro (Vision)** — PDF page → structured question JSON
- **DeepSeek V4 Pro (Chat)** — AI explanations & tutoring
- **Azure Blob Storage** — Image & note storage

### DevOps
- **Docker + Docker Compose** — Local development
- **GitHub Actions** — CI/CD
- **Azure App Service** — .NET hosting
- **Azure Static Web Apps** — Angular hosting
- **Azure PostgreSQL** — Managed database

---

## 🚀 Quick Start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Angular CLI](https://angular.dev/cli) (`npm install -g @angular/cli`)
- [DeepSeek API Key](https://platform.deepseek.com/) (set as `DEEPSEEK_API_KEY` env var)

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/RevisionAI.git
cd RevisionAI
```

### 2. Start Infrastructure (PostgreSQL + Azure Emulator)

```bash
cd docker
docker compose up -d
```

### 3. Run Database Migrations

```bash
cd backend
dotnet ef database update --project src/RevisionAI.Infrastructure --startup-project src/RevisionAI.Api
```

### 4. Start Backend API

```bash
cd backend
dotnet run --project src/RevisionAI.Api
# API running on https://localhost:5001
```

### 5. Start Frontend

```bash
cd frontend
npm install
ng serve
# App running on http://localhost:4200
```

### 6. Run Data Pipeline (Optional — for populating questions)

```bash
cd pipeline
pip install -r requirements.txt
python toc_extractor.py --image /path/to/contents.png --subject anaesthesia
python pdf_slicer.py --pdf anaesthesia.pdf --toc toc.json --subject anaesthesia
python page_renderer.py --chapter output/anaesthesia/chapter_01/
python vision_parser.py --chapter output/anaesthesia/chapter_19 --subject anaesthesia
python validator.py --subject anaesthesia
python db_ingester.py --subject anaesthesia
```

---

## 📁 Project Structure

```
RevisionAI/
├── backend/
│   ├── RevisionAI.sln
│   └── src/
│       ├── RevisionAI.Api/              # Web API, controllers, middleware
│       ├── RevisionAI.Application/      # MediatR handlers, CQRS logic
│       ├── RevisionAI.Domain/           # Entities, value objects, enums
│       ├── RevisionAI.Infrastructure/   # EF Core, services, external APIs
│       └── RevisionAI.Contracts/        # DTOs, shared contracts
│
├── frontend/                            # Angular 19 PWA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/             # Reusable UI components
│   │   │   ├── pages/                  # Route pages
│   │   │   ├── services/               # API + business logic
│   │   │   └── store/                  # NgRx SignalStore
│   │   └── assets/
│   └── angular.json
│
├── pipeline/                            # Python ingestion scripts
│   ├── toc_extractor.py                # Vision → TOC JSON
│   ├── pdf_slicer.py                   # PDF → Chapter PDFs
│   ├── page_renderer.py                # Chapter → PNG pages
│   ├── vision_parser.py                # PNG → Question JSON
│   ├── validator.py                    # Validate extracted data
│   ├── azure_uploader.py               # Upload to Azure Blob
│   ├── db_ingester.py                  # JSON → PostgreSQL
│   ├── prompts/                        # Vision API system prompts
│   └── output/                         # Generated JSON + images
│
├── docker/                             # Docker Compose for local dev
│   └── docker-compose.yml
│
├── docs/                               # Documentation
│   ├── ARCHITECTURE.md
│   ├── Backend-Architecture-HLD.md
│   ├── Interview.md
│   └── PostMortem-*.md
│
├── .github/workflows/                  # CI/CD pipelines
│   ├── ci.yml
│   └── deploy-*.yml
│
├── PRD.md                              # Product Requirements Document
├── PHASES.md                           # Phase-by-phase implementation plan
├── AGENTS.md                           # Agent orchestration guide
└── README.md                           # This file
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](./PRD.md) | Complete product requirements, user stories, feature list |
| [PHASES.md](./PHASES.md) | Phase-by-phase implementation plan with 25+ sub-phases |
| [AGENTS.md](./AGENTS.md) | Agent orchestration guide with copy-paste prompts for Cline |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture, design patterns, tradeoffs |
| [Backend-Architecture-HLD.md](./docs/Backend-Architecture-HLD.md) | Detailed API design and service architecture |
| [Interview.md](./docs/Interview.md) | STAR-format interview questions derived from this project |

---

## 🎮 How It Works

```
Every hour, RevisionAI selects 2 personalized questions just for you.
You answer them in an Instagram-Stories-like immersive card.
Correct? +10 XP! Wrong? See why, learn from AI, try again later.
Your streak grows. Your weak topics get targeted. Your dashboard fills with insights.
You're not studying anymore — you're leveling up.
```

---

## 🔒 Security

- JWT with 15-minute access tokens + rotating refresh tokens
- Google OAuth 2.0 for social login
- API keys stored in Azure Key Vault, never in code
- All queries scoped to authenticated user
- Input validation via FluentValidation pipeline

---

## 📈 Status

| Phase | Status |
|-------|--------|
| Phase 0: Foundation | 🔨 In Progress |
| Phase 1: Data Pipeline | 📅 Planned |
| Phase 2: Core Backend | 📅 Planned |
| Phase 3: Frontend | 📅 Planned |
| Phase 4: AI Features | 📅 Planned |
| Phase 5: Deploy | 📅 Planned |

---

## 👤 Author

Built as a personal project to help a procrastinating doctor sister prepare for NEET PG — while demonstrating full-stack .NET + Angular + Azure skills for senior engineering roles.

---

## 📄 License

MIT — See [LICENSE](./LICENSE) file.

---

*"The best way to stop procrastinating is to make studying feel like a game you can't put down."*