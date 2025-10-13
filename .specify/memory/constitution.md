<!--
Sync Impact Report:
- Version change: 1.2.0 → 1.3.0
- List of modified principles:
  - I. NestJS Monorepo Architecture → I. Service-Oriented Architecture
  - III. Modular Extension System → III. Future-Ready Service Extensions
- Added sections: None
- Removed sections: 
  - V. Service-Oriented Design
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs:
  - None
-->
# Web Admin Interface Constitution

## Core Principles

### I. Service-Oriented Architecture
The application's core business logic MUST be encapsulated in well-defined services, organized by internal domains. These services should be consumed by the server-side rendering engine to generate HTML. Where necessary, these same services can be exposed via a documented and tested API for extensions or asynchronous client-side interactions.

### II. Server-Side Rendering (SSR) with JSX
The application MUST use server-side rendering with JSX for the frontend. This ensures a fast initial page load and a good user experience.

### III. Future-Ready Service Extensions
While direct third-party extensions are not supported in the initial version, the architecture MUST be designed to accommodate future expansion through a modular extension system. New internal services SHOULD be developed as self-contained packages, encapsulating both their backend logic and frontend UI components. This prepares the application for a future where new features can be added as pluggable extensions.

### IV. Test-Driven Development (TDD)
All new features and bug fixes MUST be accompanied by a comprehensive suite of tests. TDD is mandatory: tests are written first, then the implementation.

## Development Workflow

All new features and bug fixes MUST be developed in a separate branch and submitted as a pull request. Pull requests MUST be reviewed and approved by at least one other developer before being merged into the main branch.

## Governance

This constitution is the supreme law of the project. All other documents, practices, and decisions MUST be consistent with it. Amendments to this constitution require a formal proposal, a period of public discussion, and a supermajority vote of the project's core contributors.

**Version**: 1.3.0 | **Ratified**: 2025-09-22 | **Last Amended**: 2025-09-22