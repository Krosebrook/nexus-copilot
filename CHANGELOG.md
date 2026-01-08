# Changelog

All notable changes to the Nexus Copilot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive project documentation suite
- MVP roadmap with 10 new feature blueprints
- Security policy and vulnerability reporting process
- Architecture documentation and decision records

### Changed
- Updated `glob` to v11.0.0 (from v10.4.5) - fixes high severity command injection vulnerability
- Updated `js-yaml` to v4.1.1 (from v4.1.0) - fixes moderate severity prototype pollution vulnerability
- Updated `mdast-util-to-hast` to v13.2.1 (from v13.2.0) - fixes moderate severity unsanitized class attribute vulnerability
- Updated `vite` to v6.4.1 (from v6.1.0) - fixes moderate severity server.fs.deny bypass vulnerability

### Removed
- `jspdf` package (unused dependency with critical/high severity DoS and ReDoS vulnerabilities)
- `html2canvas` package (unused dependency of jspdf with moderate severity XSS vulnerability)
- `react-quill` package (unused dependency with moderate severity XSS vulnerability)
- `dompurify` package (unused dependency of jspdf with moderate severity XSS vulnerability)

### Fixed
- All 20 ESLint errors related to unused imports across 13 files
- All 8 npm security vulnerabilities (6 moderate, 1 high, 1 critical)

## [0.1.0] - 2024-12-30

### Added
- Initial release of Nexus Copilot
- AI-powered copilot interface with natural language processing
- Dashboard with organization statistics and activity feed
- Query history with filtering and search capabilities
- Knowledge base management system
- Integration support for external services (Slack, GitHub, etc.)
- Approval workflow system for query oversight
- System health monitoring dashboard
- Settings page for organization and user management
- Onboarding flow for new users and organizations
- Authentication via Base44 SDK
- Real-time query processing with context awareness
- Audit logging for compliance tracking
- Member invitation and management
- Organization-based multi-tenancy
- Responsive UI with Tailwind CSS and Radix UI components
- Global search functionality (⌘K)
- Dark mode support via next-themes
- Toast notifications with Sonner
- Form validation with Zod and React Hook Form
- Data fetching with TanStack Query (React Query)
- Animations with Framer Motion

### Tech Stack
- **Frontend**: React 18, Vite 6, Tailwind CSS 3.4
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Query for server state, Context API for global UI state
- **Backend**: Base44 SDK (serverless functions)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Known Issues
- No test infrastructure in place
- 8 npm security vulnerabilities (6 moderate, 1 high, 1 critical)
- Missing comprehensive API documentation
- No deployment guide available

[Unreleased]: https://github.com/Krosebrook/nexus-copilot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Krosebrook/nexus-copilot/releases/tag/v0.1.0
