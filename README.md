# DiagramFlow

DiagramFlow is a web application for creating, editing, sharing, and collaborating on diagrams in real time.

The project is developed as an MVP using the technical stack and requirements provided by the mentor.

## Architecture

DiagramFlow uses a modular monolith architecture.

The backend is deployed as a single NestJS application, while the business logic is separated into modules with explicit responsibilities.

Planned backend modules:

- Auth
- Users
- Diagrams
- Editor
- Collaboration
- Files

### Why a modular monolith?

The MVP features are strongly connected:

- collaboration modifies diagrams;
- sharing controls editing permissions;
- history stores editor operations;
- autosave updates the current diagram state.

Keeping these operations inside one backend allows us to use local service calls and PostgreSQL transactions without introducing distributed transactions or network communication between backend services.

Compared with microservices, the modular monolith provides:

- simpler deployment;
- simpler debugging and testing;
- consistent database transactions;
- lower infrastructure complexity;
- clear module boundaries that can be extracted later if scaling requires it.

## Repository structure

```text
apps/
├── web/          React frontend
└── api/          NestJS backend

libs/
└── contracts/    Shared Zod contracts

prisma/
└── schema.prisma

compose.yaml
```

The repository is an Nx monorepo containing two applications:

- `web` — the React client;
- `api` — the NestJS modular monolith.

The shared `contracts` library will contain Zod schemas for HTTP and Socket.IO payloads.

## Data flow

A persistent editor modification will follow this flow:

```text
React Flow interaction
→ frontend creates an operation
→ Socket.IO sends the operation
→ backend validates authentication and permissions
→ Prisma stores the operation in PostgreSQL
→ backend broadcasts the accepted operation
→ connected clients update their canvas
```

Temporary drag previews will be transmitted through Socket.IO but will not be stored for every mouse movement.

## Technology stack

### Frontend

- React
- TypeScript
- React Flow
- TailwindCSS
- Zustand
- React Query

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO
- Zod

### Infrastructure

- Nx
- Docker
- Docker Compose
- Nginx
- GitHub Actions

## Local development

Install dependencies:

```powershell
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Start PostgreSQL and Redis:

```powershell
docker compose up -d
```

Generate Prisma Client:

```powershell
npx prisma generate
```

Start the backend:

```powershell
npx nx serve api
```

Start the frontend in another terminal:

```powershell
npx nx serve web
```

## Verification

Run lint, tests, and production builds:

```powershell
npx nx run-many -t lint test build --all
```

Validate the Prisma schema:

```powershell
npx prisma validate
```

Validate Docker Compose:

```powershell
docker compose config
```

## Current status

The initial project foundation is configured:

- Nx monorepo;
- React application;
- NestJS application;
- shared contracts library;
- PostgreSQL and Redis containers;
- Prisma configuration;
- Zod dependency;
- lint, tests, and production builds.

The next implementation milestone is authentication.
