# Agent Instructions

## Overview

Read `.specify/memory/constitution.md` for golden rules about the project architecture and development workflow.

## Coding Rules

- **Always** run `npm run lint` and `npm run test` after making code changes.

## Operations

- Build of the project is done using `npm run build` to compile the project and copy static assets.
- Starting the development server is done using the vscode task `Run Dev Server`.
- Starting the database server is done using the vscode task `Docker: Compose Up`.

## Database Workflow

- Environment variables for database connectivity live in `.env` at the project root:
  - `DATABASE_URL` for runtime Prisma Client connections
  - `MIGRATION_DATABASE_URL` for migration operations (optional; falls back to `DATABASE_URL`)
- Typical local development flow:
  1. Start PostgreSQL via VS Code task "Docker: Compose Up" (or `docker compose up -d`)
  2. Ensure `.env` is configured (see `.env.example`)
  3. Build once to generate Prisma Client and schemas: `npm run build`
  4. Create/apply migrations as your schemas change:
     - `npx prisma migrate dev --name <change>`
  5. Run the dev server: VS Code task "Run Dev Server"
- Useful Prisma commands:
  - `npx prisma migrate status` — verify database is up to date
  - `npx prisma studio` — browse data
  - `npx prisma generate` — regenerate Prisma Client (normally handled by the build)

## Configuration

- Environment variables are defined in the `.env` file at the project root.
- Database connection strings should use the following environment variables:
  - `DATABASE_URL` for runtime connections.
  - `MIGRATION_DATABASE_URL` for migration operations.
- Docker Compose configuration is defined in `docker-compose.yml` at the project root.
- Database initialization scripts can be placed in `database/init-scripts` to set up roles and initial data.