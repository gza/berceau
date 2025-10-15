<!--
Sync Impact Report:
- Version change: 1.4.0 → 1.5.0
- List of modified principles: None
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .github/prompts/speckit.tasks.prompt.md (✅ updated)
  - .github/prompts/speckit.constitution.prompt.md (✅ updated)
  - README.md (✅ reviewed, no changes required)
- Follow-up TODOs:
  - None
-->
# Web Admin Platform Constitution

## Core Principles

### I. Service-Oriented Architecture
The ultimate goal is to provide a framework and hosting platform for features deployed as third-party components called "components". The platform's system components MUST be encapsulated in well-defined services, organized by internal domains. These "systemComponents" services should be consumed by others "components" or "systemComponents". These services are exposed via a documented and tested API (Typescript, or network based API).

### II. UI Server-Side Rendering (SSR) with JSX
The application MUST use server-side rendering with JSX for the UI. This ensures a fast initial page load and a good user experience.

### III. Component-Hosting Platform
The Platform MUST guarantee to third-party components a secure, reliable and well-documented environment, ensuring they can interact with others and the platform's core services effectively.

### IV. Test-Driven Development (TDD)
All new features and bug fixes MUST be accompanied by a comprehensive suite of tests. TDD is mandatory: tests are written first, then the implementation.

### V. Security by Design
All development MUST consider and mitigate threats outlined in the OWASP Top 10. Features must be designed and implemented with security as a primary consideration, and code should be reviewed for potential vulnerabilities before deployment.

## Development Workflow

All new features and bug fixes MUST be developed in a separate branch and submitted as a pull request. Pull requests MUST be reviewed and approved by at least one other developer before being merged into the main branch.

## Governance

This constitution is the supreme law of the project. All other documents, practices, and decisions MUST be consistent with it. Amendments to this constitution require a formal proposal, a period of public discussion, and a supermajority vote of the project's core contributors.

Versioning & Compliance:
- Versioning policy: All amendments MUST follow Semantic Versioning.
  - MAJOR: Backward-incompatible governance/principle removals or redefinitions
  - MINOR: New principle/section added or materially expanded guidance
  - PATCH: Clarifications, wording, and non-semantic refinements
- Compliance review: Every feature plan MUST include a "Constitution Check" gate.
  Reviewers MUST block merges that violate non-negotiable principles. The project
  MUST conduct a compliance review at least once per minor release (or quarterly),
  logging any justified exceptions in feature plans under "Complexity Tracking".

**Version**: 1.5.0 | **Ratified**: 2025-09-22 | **Last Amended**: 2025-10-15