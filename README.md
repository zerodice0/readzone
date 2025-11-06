# ReadZone - Book Review Platform

ReadZone is a modern book review and reading management platform with comprehensive user authentication.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **pnpm** 8.x or higher (`npm install -g pnpm@8`)
- **Docker** and **Docker Compose** ([Get Docker](https://docs.docker.com/get-docker/))

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd readzone

# Install dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# At minimum, update:
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - SESSION_SECRET (generate with: openssl rand -base64 32)
# - OAuth credentials (Google, GitHub)
# - SMTP credentials (SendGrid)
```

### 3. Start Development Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps

# Check health
docker-compose exec postgres pg_isready
docker-compose exec redis redis-cli ping
```

### 4. Setup Database

```bash
# Run Prisma migrations
pnpm --filter @readzone/backend migrate

# Seed database with test data (optional)
pnpm --filter @readzone/backend db:seed
```

### 5. Start Development Servers

```bash
# Start all services (backend + frontend)
pnpm dev

# Backend will run on: http://localhost:3000
# Frontend will run on: http://localhost:5173
```

## 📦 Project Structure

```
readzone/
├── packages/
│   ├── backend/          # Fastify API server
│   │   ├── src/
│   │   │   ├── server.ts         # Entry point
│   │   │   ├── app.ts            # Fastify app config
│   │   │   ├── modules/          # Feature modules
│   │   │   └── common/           # Shared utilities
│   │   └── prisma/               # Database schema & migrations
│   │
│   ├── frontend/         # React + Vite application
│   │   ├── src/
│   │   │   ├── features/         # Feature-based components
│   │   │   ├── lib/              # Auth context, API client
│   │   │   └── pages/            # Page components
│   │   └── public/               # Static assets
│   │
│   └── shared/           # Shared types and utilities
│       └── src/
│           └── types/            # TypeScript type definitions
│
├── docker-compose.yml    # PostgreSQL + Redis setup
├── .env.example          # Environment template
└── README.md             # This file
```

## 📜 Available Scripts

### Root Level

```bash
pnpm dev              # Start all packages in development mode
pnpm build            # Build all packages
pnpm lint             # Run ESLint on all packages
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without changes
pnpm type-check       # Run TypeScript type checking
```

### Backend

```bash
pnpm --filter @readzone/backend dev           # Start backend dev server
pnpm --filter @readzone/backend build         # Build backend
pnpm --filter @readzone/backend migrate       # Run Prisma migrations
pnpm --filter @readzone/backend db:seed       # Seed database
pnpm --filter @readzone/backend test          # Run tests
```

### Frontend

```bash
pnpm --filter @readzone/frontend dev          # Start frontend dev server
pnpm --filter @readzone/frontend build        # Build frontend for production
pnpm --filter @readzone/frontend preview      # Preview production build
pnpm --filter @readzone/frontend test         # Run tests
```

## 🧰 Tech Stack

### Backend
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache/Sessions**: Redis 7
- **Authentication**: JWT + @fastify/jwt, OAuth 2.0, MFA (TOTP)
- **Validation**: Zod
- **Password Hashing**: Argon2
- **Email**: SendGrid / AWS SES

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS (to be configured)
- **State Management**: React Context API

### Development Tools
- **Monorepo**: pnpm workspaces
- **Linting**: ESLint (Airbnb TypeScript config)
- **Formatting**: Prettier
- **Pre-commit**: Husky + lint-staged
- **Testing**: Vitest
- **Type Safety**: TypeScript 5.3 (strict mode)

## 🔐 Authentication Features

- Email-based registration with verification
- Social login (Google, GitHub OAuth)
- Password reset via email
- Session management with "remember me"
- Multi-factor authentication (TOTP)
- Active session monitoring
- Rate limiting and brute-force protection
- Audit logging

## 🛠️ Development Workflow

### Code Quality

All code must pass:
- TypeScript strict mode compilation (no `any` types)
- ESLint checks (Airbnb TypeScript config)
- Prettier formatting
- Pre-commit hooks (automatic)

### Database Changes

```bash
# Create a new migration
pnpm --filter @readzone/backend prisma migrate dev --name <migration-name>

# Apply migrations
pnpm --filter @readzone/backend prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm --filter @readzone/backend prisma migrate reset
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset volumes (WARNING: deletes all data)
docker-compose down -v
```

## 🐛 Troubleshooting

### Port Conflicts

If ports 5432 (PostgreSQL) or 6379 (Redis) are already in use:

```yaml
# Edit docker-compose.yml and change ports:
services:
  postgres:
    ports:
      - '5433:5432'  # Use different host port
  redis:
    ports:
      - '6380:6379'  # Use different host port
```

Then update `DATABASE_URL` and `REDIS_URL` in `.env`:

```bash
DATABASE_URL=postgresql://readzone:readzone_dev_password@localhost:5433/readzone
REDIS_URL=redis://:readzone_dev_redis_password@localhost:6380/0
```

### pnpm Installation Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Prisma Issues

```bash
# Regenerate Prisma Client
pnpm --filter @readzone/backend prisma generate

# Reset database and migrations
pnpm --filter @readzone/backend prisma migrate reset
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.
