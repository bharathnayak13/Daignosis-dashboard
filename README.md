# 🏥 Smart Diagnostic Center Management System

A **production-ready, full-stack** healthcare management platform for diagnostic centers — built with Next.js 15, Express, PostgreSQL, Prisma, Socket.IO, and Docker.

---

## 📸 Features at a Glance

| Feature | Details |
|---|---|
| **Authentication** | JWT, bcrypt, role-based access, forgot password |
| **5 Roles** | Admin, Doctor, Lab Technician, Receptionist, Patient |
| **Patient Management** | Search, profile, medical history, file uploads |
| **Appointments** | Booking, queue, calendar, real-time updates |
| **Lab Tests** | Order, track, results, PDF report generation |
| **Reports** | Upload scans/PDFs, download, manage |
| **Invoices** | Create, PDF generation, mark paid |
| **Analytics** | Revenue charts, patient demographics, doctor workload |
| **Real-time** | Socket.IO queue & appointment updates |
| **Dark/Light Mode** | Full theme support |
| **Docker** | One-command deployment |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### 1. Clone & Setup

```bash
cd smart-diagnostic-center
cp .env.example .env          # fill in values
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL and JWT_SECRET

npm install
npx prisma migrate dev --name init
npx prisma generate
npm run seed                   # creates demo users
npm run dev                    # starts on :5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env.local    # edit NEXT_PUBLIC_API_URL if needed

npm install
npm run dev                    # starts on :3000
```

Open **http://localhost:3000**

---

## 🐳 Docker Deployment (Recommended)

```bash
# From the project root
cp .env.example .env          # edit JWT_SECRET and passwords

docker-compose up -d           # starts postgres + backend + frontend

# Run migrations inside the container
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

Services:
- Frontend → http://localhost:3000
- Backend API → http://localhost:5000/api
- PostgreSQL → localhost:5432

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@sdc.com | Admin@123 |
| **Doctor** | dr.sharma@sdc.com | Doctor@123 |
| **Doctor** | dr.patel@sdc.com | Doctor@123 |
| **Receptionist** | reception@sdc.com | Recep@123 |
| **Lab Technician** | lab@sdc.com | Lab@12345 |
| **Patient** | arjun@gmail.com | Patient@123 |

---

## 📁 Project Structure

```
smart-diagnostic-center/
│
├── frontend/                        # Next.js 15 App
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── auth/                # Login, Register, Forgot Password
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── patients/            # Patient list + detail + new
│   │   │   ├── appointments/        # Appointment management
│   │   │   ├── lab/                 # Lab test management
│   │   │   ├── reports/             # Report management
│   │   │   ├── invoices/            # Invoice management
│   │   │   ├── analytics/           # Charts & analytics
│   │   │   ├── doctors/             # Doctor directory
│   │   │   ├── activity/            # Audit logs
│   │   │   └── settings/            # User settings
│   │   ├── components/
│   │   │   ├── layout/              # Sidebar, Topbar, AppLayout
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   └── charts/              # StatCard, chart wrappers
│   │   ├── lib/                     # api.ts, utils.ts
│   │   ├── store/                   # Zustand auth store
│   │   └── styles/                  # globals.css
│   ├── Dockerfile
│   └── package.json
│
├── backend/                         # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/             # Business logic per domain
│   │   ├── routes/                  # Express routers
│   │   ├── middleware/              # auth.ts, errorHandler.ts
│   │   └── utils/                   # prisma, logger, socket, seed
│   ├── prisma/
│   │   └── schema.prisma            # Full DB schema (9 models)
│   ├── uploads/                     # File storage (reports, scans)
│   ├── Dockerfile
│   └── package.json
│
├── docker/
│   └── postgres/init.sql
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🗄️ Database Schema

9 core models with full relationships:

```
User ──────┬── Patient ──── Appointment ── LabTest ── Report
           │                              │
           ├── Doctor ────────────────────┘
           │
           ├── Notification
           └── ActivityLog

Invoice ── Patient
Setting (key-value store)
MedicalHistory ── Patient
```

---

## 🔌 API Endpoints

| Group | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | login, register, me, change-password |
| Patients | `/api/patients` | CRUD, search, history |
| Appointments | `/api/appointments` | CRUD, queue, calendar |
| Lab Tests | `/api/lab-tests` | CRUD, status, generate-report |
| Reports | `/api/reports` | list, upload |
| Invoices | `/api/invoices` | CRUD, pay, PDF |
| Analytics | `/api/analytics` | dashboard, revenue, lab, doctors |
| Notifications | `/api/notifications` | list, read, delete |
| Upload | `/api/upload` | file, report |
| Settings | `/api/settings` | get, update |
| Activity | `/api/activity` | logs |

---

## ⚙️ Environment Variables

### Backend `.env`

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for JWT signing | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | API server port | `5000` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |
| `MAX_FILE_SIZE` | Upload limit in bytes | `10485760` |

### Frontend `.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL |

---

## 📦 Tech Stack

**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- Framer Motion (animations)
- Recharts (charts)
- Zustand (state management)
- React Hook Form + Zod (forms/validation)
- Socket.IO Client (real-time)
- Axios (HTTP)

**Backend**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- JWT + bcryptjs (auth)
- Socket.IO (real-time)
- Multer (file uploads)
- PDFKit (PDF generation)
- Winston (logging)

**Infrastructure**
- Docker + Docker Compose
- Multi-stage Dockerfiles

---

## 🛠️ Development Commands

```bash
# Backend
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm run seed             # Seed demo data
npx prisma studio        # Visual DB browser
npx prisma migrate dev   # Create migration

# Frontend
npm run dev              # Start dev server
npm run build            # Production build
npm run type-check       # TypeScript check
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

> Built for modern diagnostic centers. Designed for real-world healthcare workflows.
