# monobackend Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-27

## Active Technologies
- TypeScript (Node.js 20+), NestJS 11 + Nodemailer (SMTP client), React/ReactDOM SSR (existing), NestJS Logger (existing) (004-outgoing-email)
- N/A (no persistence; transient processing only) (004-outgoing-email)
- TypeScript 5.9 (Node.js 20+) + NestJS 11, Prisma 6.17 (PostgreSQL ORM), React 19 (SSR), Nodemailer 7, express-session 1.18 (005-auth)
- PostgreSQL via Prisma (existing) - will add User, AuthToken, Session entities (005-auth)
- PostgreSQL via Prisma (existing) - will add User and AuthToken entities; Sessions stored in-memory (005-auth)

- TypeScript (Node.js 20+), NestJS 11 + React/ReactDOM SSR (existing), NestJS Logger (existing), SMTP client (Nodemailer planned) (004-outgoing-email)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (Node.js 20+), NestJS 11: Follow standard conventions

## Recent Changes
- 005-auth: Added TypeScript 5.9 (Node.js 20+) + NestJS 11, Prisma 6.17 (PostgreSQL ORM), React 19 (SSR), Nodemailer 7, express-session 1.18
- 005-auth: Added TypeScript 5.9 (Node.js 20+) + NestJS 11, Prisma 6.17 (PostgreSQL ORM), React 19 (SSR), Nodemailer 7, express-session 1.18
- 005-auth: Added TypeScript 5.9 (Node.js 20+) + NestJS 11, Prisma 6.17 (PostgreSQL ORM), React 19 (SSR), Nodemailer 7, express-session 1.18


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
