# DiagramFlow

DiagramFlow is an Nx monorepo for creating, editing, organizing, and sharing diagrams.

The current MVP includes authentication, profile management, folders, diagram sharing,
an interactive React Flow editor, image uploads, and versioned snapshot autosave.
Real-time collaboration and operation history remain planned milestones and are not yet
implemented.

## Architecture

DiagramFlow uses a modular monolith architecture:

- `apps/web` contains the React client;
- `apps/api` contains the NestJS backend;
- `libs/contracts` contains shared Zod request and response contracts;
- `libs/api-ports` contains backend repository ports;
- PostgreSQL stores application data and diagram snapshots;
- Redis supports short-lived infrastructure concerns such as email verification;
- Mailpit receives development emails locally.

The backend is deployed as one application, while its business logic is separated into
feature modules with explicit responsibilities:

- Auth;
- Profile;
- Folders;
- Diagrams;
- shared infrastructure for Prisma, Redis, and email.

### Why a modular monolith?

The MVP features are strongly connected. Authentication, permissions, sharing, and
diagram persistence benefit from local service calls and consistent PostgreSQL
transactions. This keeps deployment and debugging simpler without preventing modules
from being extracted later if scaling requires it.

## Repository structure

```text
apps/
├── api/          NestJS API
└── web/          React client

libs/
├── api-ports/    Backend repository contracts
└── contracts/    Shared Zod contracts

prisma/
├── migrations/   Database migrations
└── schema.prisma

compose.yaml      PostgreSQL, Redis, and Mailpit
```

## Implemented features

### Authentication and profile

- registration and email confirmation;
- verification email resend flow;
- login, refresh, and logout;
- authenticated profile retrieval and update;
- avatar upload;
- password change.

### Diagram dashboard

- create, rename, duplicate, move, and delete diagrams;
- create and delete folders;
- navigate diagrams by folder;
- share a diagram with another registered user;
- list diagrams shared with the current user.

### Diagram editor

- rectangle, circle, diamond, triangle, text, sticky-note, container, and image nodes;
- connector and arrow edges;
- node movement, resizing, selection, and deletion;
- copy and paste for selected nodes and their internal edges;
- diagram image upload;
- editable node label, colors, border width, opacity, rotation, font, and text alignment;
- manual save and debounced autosave;
- snapshot restoration after page reload;
- optimistic version checks that reject conflicting saves.

## Current editor data flow

```text
React Flow interaction
→ Zustand updates nodes, edges, or viewport
→ the editor marks the snapshot as dirty
→ autosave waits 1 second after the latest change
→ the React client sends the complete snapshot through the REST API
→ the NestJS API validates authentication, access, input, and expected version
→ Prisma stores the snapshot and increments its version
→ reloading the editor hydrates Zustand from the stored snapshot
```

Real-time Socket.IO operations, presence, and history are intentionally documented as
future milestones rather than current behavior.

## Technology stack

### Frontend

- React 19;
- TypeScript;
- React Flow;
- Zustand;
- TanStack Query;
- Vite;
- Tailwind CSS;
- Vitest and Testing Library.

### Backend

- NestJS;
- Prisma ORM;
- PostgreSQL;
- Redis;
- Zod;
- Jest.

### Tooling and local infrastructure

- Nx;
- Docker Compose;
- Mailpit;
- ESLint.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Replace the development placeholder secrets before running the API outside an isolated
local environment.

### 3. Start local infrastructure

Start Docker Desktop, then run:

```bash
docker compose up -d
```

Apply existing migrations and generate Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the backend

```bash
npx nx serve api
```

The API is available at `http://localhost:3000/api`.

### 5. Start the frontend

In another terminal:

```bash
npx nx serve web
```

The application is available at `http://localhost:4200`.

Development emails are available in Mailpit at `http://localhost:8025`.

## Verification

Run project verification:

```bash
npx nx run-many -t typecheck lint test build --all
```

Run only the web checks:

```bash
npx nx typecheck web
npx nx lint web
npx nx test web --run
npx nx build web
```

Validate Prisma and Docker Compose configuration:

```bash
npx prisma validate
docker compose config
```

## Current status and next milestones

The REST-based MVP workflow is functional: a user can authenticate, organize diagrams,
edit a diagram, change node properties, save it, and restore it after reload.

Recommended next milestones:

1. finish editor regression tests and run the complete production build;
2. verify every mentor requirement against the implemented feature list;
3. implement real-time collaboration only if it is required for the MVP;
4. add operation history after the collaboration contract is stable;
5. add deployment infrastructure and production documentation;
6. treat inline text editing and other editor shortcuts as post-MVP usability upgrades.
