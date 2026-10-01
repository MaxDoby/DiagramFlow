# DiagramFlow

DiagramFlow is an Nx monorepo for creating, editing, organizing, and sharing diagrams.

The current MVP includes authentication, profile management, folders, diagram sharing,
an interactive React Flow editor, image uploads, persisted content operations,
autosave, and real-time collaboration. Presence cursors and a visual history browser
are not implemented.

## Architecture

DiagramFlow uses a modular monolith architecture:

- `apps/web` contains the React client;
- `apps/api` contains the NestJS backend;
- `libs/contracts` contains shared Zod request and response contracts;
- `libs/api-ports` contains backend repository ports;
- PostgreSQL stores application data, diagram snapshots, and the ordered operation log;
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
- manual save and throttled operation autosave with retry;
- snapshot restoration after page reload;
- live collaborative updates without reloading the editor;
- reconnection synchronization and duplicate-operation protection;
- local Undo/Redo rebased over remote changes.

## Current editor data flow

```text
React Flow interaction
→ Zustand updates content and queues a field-level operation
→ autosave batches queued changes, preserving each change and a stable request ID
→ the React client posts the operation through the REST API
→ NestJS validates authentication, diagram membership, and the Zod contract
→ PostgreSQL locks this diagram row and atomically saves operation + snapshot + version
→ Socket.IO broadcasts the committed operation to all editors, including its author
→ each editor applies the operation and reapplies its still-pending local changes
→ reconnection sync repairs version gaps and acknowledges already-committed requests
```

This is a server-ordered MVP protocol, not an offline CRDT.

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
3. verify collaboration in the deployed frontend/API environment;
4. optionally add presence cursors and a visual operation-history browser;
5. add deployment infrastructure and production documentation;
6. treat inline text editing and other editor shortcuts as post-MVP usability upgrades.

## Upload storage and private diagram images

Uploads accept JPEG, PNG and WebP only (avatars: 2 MB; diagram images: 5 MB).
The API decodes and re-encodes each image with Sharp, rejects invalid content,
MIME mismatches, animated files and images above 16 megapixels.

Diagram images are no longer served from the public `/uploads/diagram-images/`
path. The editor fetches `/api/diagrams/:diagramId/images/:fileName` using its
access token. Access requires both membership in the diagram and an image
association with that diagram. The migration backfills associations from saved
snapshots; duplication preserves those associations. Avatars remain public.

`UPLOADS_ROOT` is the storage directory. Local development uses `uploads`.
The Render blueprint now configures `/var/data/uploads` on a persistent disk.
**The API blueprint uses a paid Starter instance because Render does not support
persistent disks on free web services. This configuration has not been deployed.**
See https://render.com/docs/disks before activating it.

Before deploying, back up the existing `uploads/avatars` and
`uploads/diagram-images` directories and copy their contents to the corresponding
folders on the mounted disk. The SQL migration preserves references, not file
bytes: it cannot recover files lost by previous ephemeral deploys. Apply migrations
before starting the updated API (`npx prisma migrate deploy`, already in the
Render start command). Verify an uploaded image after restarting/redeploying.

The volume approach is intended for this single-instance MVP. Do not enable
multiple API instances sharing separate local upload directories.
