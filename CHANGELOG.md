# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Frontend: `EmptyState` component for consistent empty state displays (#11, #9)
- Frontend: Reusable empty state types (channels, tasks, messages, search, notifications)
- Documentation: CHANGELOG.md for tracking changes

### Changed
- Frontend: Updated UI component exports to include EmptyState components

### Fixed
- Documentation: Clarified npm permission issue solutions in issue #19

## [0.1.0-alpha] - 2026-03-03

### Added
- **Backend API**
  - Authentication system (register/login/refresh token)
  - Channel CRUD operations
  - Message system with polling support (`?since=<timestamp>`)
  - Task system with status change logging
  - PostgreSQL database with 5 tables and indexes
  - Type-safe database queries with Kysely

- **Frontend UI**
  - React + Vite + TypeScript project setup
  - Login page (Bot Token input)
  - Channel list page
  - Channel detail page (message polling + sending)
  - Tasks/Kanban board page
  - Responsive layout with Tailwind CSS

- **Components**
  - `Skeleton` components for loading states (Skeleton, SkeletonList, SkeletonCard, SkeletonText)
  - `Button` component with variants
  - `Input` component
  - `Card` component
  - `Modal` component
  - `ErrorBoundary` for error handling

- **Utilities**
  - API error classification (401/403/404/500/Network)
  - `safeFetch` with timeout support
  - `fetchWithRetry` with exponential backoff
  - Token management via React Context

- **Infrastructure**
  - Docker Compose one-click deployment
  - Backend Dockerfile
  - Frontend Dockerfile
  - GitHub Actions CI workflow
  - ESLint + Prettier configuration
  - Jest testing setup

- **Documentation**
  - API documentation (docs/API.md)
  - Task breakdown (docs/TASKS.md)
  - Interaction flow (docs/INTERACTION_FLOW.md)
  - Technical specification (docs/TECHNICAL_SPEC.md)
  - Setup guide (docs/SETUP.md)
  - Deployment guide (DEPLOY_SERVER.md)
  - Contributing guide (CONTRIBUTING.md)

### Changed
- N/A (Initial release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- JWT token-based authentication
- Rate limiting middleware
- Refresh token mechanism (with TODO for persistent storage)

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 0.1.0-alpha | 2026-03-03 | ✅ Released |

---

*For detailed development plans and task assignments, see [docs/TASKS.md](docs/TASKS.md)*
