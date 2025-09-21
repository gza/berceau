<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. NestJS Monorepo Architecture
  - [PRINCIPLE_2_NAME] → II. Server-Side Rendering (SSR) with JSX
  - [PRINCIPLE_3_NAME] → III. Modular Extension System
  - [PRINCIPLE_4_NAME] → IV. Test-Driven Development (TDD)
  - [PRINCIPLE_5_NAME] → V. Service-Oriented Design
- Added sections:
  - Development Workflow
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): The ratification date needs to be set.
-->
# Web Admin Interface Constitution

## Core Principles

### I. NestJS Monorepo Architecture
The project MUST be structured as a monorepo, with separate packages for the main application and each extension. This promotes code reuse and simplifies dependency management.

### II. Server-Side Rendering (SSR) with JSX
The application MUST use server-side rendering with JSX for the frontend. This ensures a fast initial page load and a good user experience.

### III. Modular Extension System
The application MUST have a modular extension system that allows for new features to be added easily. Each extension MUST be a self-contained package.

### IV. Test-Driven Development (TDD)
All new features and bug fixes MUST be accompanied by a comprehensive suite of tests. TDD is mandatory: tests are written first, then the implementation.

### V. Service-Oriented Design
The application's core business logic MUST be encapsulated in well-defined services. These services should be consumed by the server-side rendering engine to generate HTML. Where necessary, these same services can be exposed via a documented and tested API for extensions or asynchronous client-side interactions.

## Development Workflow

All new features and bug fixes MUST be developed in a separate branch and submitted as a pull request. Pull requests MUST be reviewed and approved by at least one other developer before being merged into the main branch.

## Governance

This constitution is the supreme law of the project. All other documents, practices, and decisions MUST be consistent with it. Amendments to this constitution require a formal proposal, a period of public discussion, and a supermajority vote of the project's core contributors.

**Version**: 1.1.0 | **Ratified**: 2025-09-21 | **Last Amended**: 2025-09-21