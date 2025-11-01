# Feature Specification: Platform Authentication

**Feature Branch**: `005-auth`  
**Created**: 2025-10-31  
**Updated**: 2025-11-01  
**Status**: Draft  
**Input**: User description: "I need to add authentication to the platform using magic links, login UI, no user management yet. Authorization will come later."

## Clarifications

### Session 2025-10-31

- Q: How should authenticated sessions expire? → A: Sessions expire after inactivity timeout (e.g., 24 hours idle)
- Q: How should the system handle multiple magic link requests from the same user? → A: Invalidate previous unused magic links when a new one is requested (only the latest link works)
- Q: Should the system rate-limit magic link requests? → A: Basic rate limiting (e.g., max 5 requests per hour per user)
- Q: How should the system handle email service unavailability? → A: Show generic error to user and log the failure for monitoring
- Q: What uniqueness constraints apply to user identities? → A: Both username AND email must be unique across all users
- Q: Should magic links be restricted to the IP address or browser where they were requested? → A: No restriction (magic links work from any IP/browser)
- Q: What should happen when someone requests a magic link for a non-existent username/email? → A: Show same success message as existing users (e.g., "if email/user exists, you will receive an email"), but don't send email (timing-safe)

### Session 2025-11-01

- Q: How are users initially created? → A: User creation is out of scope for this feature. Will be handled by separate registration/invitation flows in future features.
- Q: What about initial user seeding for development/testing? → A: AuthModule will implement OnModuleInit hook to seed users from environment variables (SEED_USER_USERNAME, SEED_USER_EMAIL). Idempotent and optional.
- Q: What about roles and permissions? → A: Authorization (roles, permissions, access control) is deferred to a future feature. This feature focuses purely on authentication (who you are, not what you can do).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login with Magic Link (Priority: P1)

Users need a secure way to authenticate without managing passwords. They can request a magic link sent to their email address, which grants them one-time access to the platform.

**Why this priority**: This is the primary authentication method and must work for the system to be usable. Foundation for secure access control.

**Independent Test**: Can be tested by entering a valid email/username at the login screen, receiving an email with a magic link, clicking the link, and being logged into the platform.

**Acceptance Scenarios**:

1. **Given** a user with email "user@example.com" exists, **When** they enter their email on the login screen and request a magic link, **Then** they receive an email containing a unique, time-limited authentication link
2. **Given** a user receives a magic link, **When** they click the link within the validity period, **Then** they are authenticated and redirected to the home page (/)
3. **Given** a user receives a magic link, **When** they click the link after it expires, **Then** they see an error message indicating the link has expired and are prompted to request a new one
4. **Given** a user clicks a magic link, **When** they try to use the same link again, **Then** the link is rejected as already used
5. **Given** a user enters their username instead of email, **When** they request a magic link, **Then** the system looks up their associated email and sends the magic link there

---

### User Story 2 - Logout (Priority: P2)

Users need the ability to explicitly end their authenticated session to secure their account, especially on shared devices.

**Why this priority**: Important for security. Users need control over their session lifecycle.

**Independent Test**: Can be tested by logging in, clicking a logout button, and verifying the session is terminated and the user must re-authenticate to access protected resources.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they click the logout button, **Then** their session is terminated and they are redirected to the login screen
2. **Given** a user has logged out, **When** they try to access protected resources, **Then** they are redirected to the login screen
3. **Given** a user logs out, **When** they use the browser back button, **Then** they cannot access protected pages and are redirected to login

---

### Edge Cases

All edge cases have been resolved through clarifications.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce uniqueness of usernames across all users
- **FR-002**: System MUST enforce uniqueness of email addresses across all users
- **FR-003**: System MUST accept both username and email address in the login form for user identification
- **FR-004**: System MUST generate unique, time-limited magic links for authentication when requested by a user
- **FR-005**: System MUST rate-limit magic link requests to a maximum of 5 requests per hour per user
- **FR-006**: System MUST send magic links to the user's registered email address
- **FR-007**: System MUST display a generic error message to the user when email service is unavailable
- **FR-008**: System MUST log email service failures for monitoring and alerting purposes
- **FR-009**: System MUST validate magic links, accepting only valid, non-expired, and unused tokens
- **FR-010**: System MUST invalidate all previous unused magic links for a user when a new magic link is requested
- **FR-011**: System MUST invalidate magic links after one successful use
- **FR-012**: System MUST invalidate magic links after expiration time (industry standard: 15 minutes)
- **FR-013**: System MUST create an authenticated session when a user successfully authenticates via magic link
- **FR-014**: System MUST expire sessions after 24 hours of inactivity
- **FR-015**: System MUST provide a logout mechanism that terminates the user's session
- **FR-016**: System MUST prevent access to protected resources for unauthenticated users
- **FR-017**: System MUST display the same response message for both existent and non-existent users when magic links are requested (e.g., "If the email/username exists, you will receive an email")
- **FR-018**: System MUST NOT send magic link emails for non-existent users while maintaining timing consistency to prevent enumeration attacks
- **FR-019**: System MUST log all authentication attempts (successful and failed) for security auditing
- **FR-020**: System MUST provide clear error messages for failed authentication attempts without revealing whether a user exists
- **FR-021**: Magic links MUST use URL structure: `GET /auth/verify/:token` where `:token` is the base64url-encoded authentication token
- **FR-022**: Email addresses MUST be normalized to lowercase for uniqueness checks and user lookups
- **FR-023**: Usernames MUST be case-sensitive (e.g., "User" and "user" are different usernames)
- **FR-024**: System MUST regenerate session ID after successful authentication to prevent session fixation attacks
- **FR-025**: Rate limit exceeded responses MUST return HTTP 429 status with generic error message: "Too many requests. Please try again later."
- **FR-026**: System MUST allow only one active session per user; new authentication invalidates any previous active session
- **FR-027**: All application routes MUST require authentication except `/auth/**` endpoints (login, magic link verification)
- **FR-028**: System MUST use a global authentication guard with explicit `@Public()` decorator to exempt public routes
- **FR-029**: User seeding (via OnModuleInit) MUST log a warning if enabled in production environment and is intended for development/testing only
- **FR-030**: Sessions MUST expire after 7 days maximum, regardless of activity (absolute expiration)
- **FR-031**: System MUST set security headers: `Content-Security-Policy: default-src 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- **FR-032**: System MUST run daily background job to delete expired authentication tokens (where `expiresAt < now()`)
- **FR-033**: System MUST log authentication events in JSON format with fields: timestamp, level, userId, action, outcome, ipAddress

### Key Entities

- **User**: Represents a person who can authenticate to the platform. Key attributes include unique identifier, unique username, unique email address, creation timestamp, and last login timestamp. Both username and email must be unique across all users.
- **Authentication Token**: Represents a time-limited magic link credential that grants one-time access. Key attributes include unique token value, associated user, creation timestamp, expiration timestamp, and usage status (unused, used, expired).
- **Session**: Represents an authenticated user's active connection to the platform. Stored in-memory (not persisted to database). Key attributes include unique session identifier, associated user, and expiration based on inactivity timeout (24 hours).

### UI Routes

- **Login Page**: `/login` - Public route where users request magic links
- **Magic Link Verification**: `/auth/verify/:token` - Public route that validates token and creates session
- **Post-Login Redirect**: `/` (root/home page) - Authenticated users redirected here after successful login
- **Logout**: `/auth/logout` - Authenticated route that terminates session and redirects to `/login`

### Out of Scope

- **User Creation**: Creating new users is not part of this feature. Will be handled by separate registration/invitation flows in future features.
- **Authorization**: Roles, permissions, and access control beyond authentication are deferred to future features.
- **User Management**: Editing user profiles, changing emails/usernames, deleting users not included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full authentication flow (request magic link → receive email → authenticate) in under 1 minute
- **SC-002**: 95% of authentication attempts using valid magic links succeed within the validity period
- **SC-003**: Zero unauthorized access attempts succeed (100% protection of resources requiring authentication)
- **SC-004**: Magic links expire reliably within their configured time limit (15 minutes)
- **SC-005**: Sessions expire automatically after 24 hours of inactivity
- **SC-006**: Users successfully log out and cannot access protected resources without re-authenticating

