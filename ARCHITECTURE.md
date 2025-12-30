# Architecture Documentation

## Overview

Nexus Copilot is an AI-powered copilot platform built on React 18 and Base44 serverless infrastructure. The application provides intelligent query processing, knowledge management, team collaboration, and organizational insights through a modern, responsive web interface.

## Table of Contents

- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Application Layers](#application-layers)
- [Data Flow](#data-flow)
- [Key Components](#key-components)
- [Design Patterns](#design-patterns)
- [Scalability Considerations](#scalability-considerations)
- [Security Architecture](#security-architecture)

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          React 18 SPA (Vite)                        │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │  Presentation Layer (Components)             │   │    │
│  │  │  - Pages, UI Components, Layouts             │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │  State Management Layer                      │   │    │
│  │  │  - TanStack Query (Server State)             │   │    │
│  │  │  - React Context (UI State)                  │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │  Business Logic Layer                        │   │    │
│  │  │  - Custom Hooks, Utils, Validators           │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Base44 SDK Layer                                │
│  - Authentication                                            │
│  - API Client                                                │
│  - Entity Management                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Base44 Backend (Serverless)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Functions  │  │  Database   │  │  AI/LLM     │         │
│  │  (Node.js)  │  │  (NoSQL)    │  │  Services   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              External Integrations                           │
│  - Slack API                                                 │
│  - GitHub API                                                │
│  - Other third-party services                                │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.2.0 | UI library |
| **Build Tool** | Vite | 6.1.0 | Fast build and HMR |
| **Routing** | React Router | 6.26.0 | Client-side routing |
| **State Management** | TanStack Query | 5.84.1 | Server state management |
| **State Management** | React Context | Built-in | Global UI state |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Components** | Radix UI | Various | Accessible primitives |
| **Forms** | React Hook Form | 7.54.2 | Form management |
| **Validation** | Zod | 3.24.2 | Schema validation |
| **Animations** | Framer Motion | 11.16.4 | UI animations |
| **Icons** | Lucide React | 0.475.0 | Icon library |
| **Notifications** | Sonner | 2.0.1 | Toast notifications |
| **Date Handling** | date-fns | 3.6.0 | Date utilities |
| **Markdown** | react-markdown | 9.0.1 | Markdown rendering |

### Backend

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Platform** | Base44 | Serverless backend platform |
| **SDK** | @base44/sdk | Client library for Base44 |
| **Database** | NoSQL (Base44) | Entity storage |
| **Authentication** | Base44 Auth | User authentication |
| **AI/LLM** | Base44 Core LLM | Natural language processing |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting and quality |
| TypeScript (JSConfig) | Type checking via JSDoc |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixes |

## Application Layers

### 1. Presentation Layer

**Location**: `src/pages/`, `src/components/`

The presentation layer consists of React components organized by feature:

#### Pages (8 main pages)
- **Dashboard**: Organization overview and statistics
- **Copilot**: Main AI query interface
- **Knowledge**: Knowledge base management
- **Approvals**: Query approval workflow
- **Settings**: Organization and user settings
- **SystemHealth**: System monitoring dashboard
- **Docs**: Documentation viewer
- **Onboarding**: New user onboarding flow

#### Component Organization
```
components/
├── admin/          # Admin-specific components
│   ├── StatsCard.jsx
│   ├── MemberList.jsx
│   ├── AuditLogTable.jsx
│   └── SystemHealthCard.jsx
├── copilot/        # Copilot feature components
│   ├── CommandInput.jsx
│   ├── ResponseCard.jsx
│   ├── ProcessingIndicator.jsx
│   ├── EmptyState.jsx
│   └── QueryHistory.jsx
├── shared/         # Shared components across features
│   ├── ActivityFeed.jsx
│   ├── GlobalSearch.jsx
│   └── PlanBadge.jsx
└── ui/             # Base UI primitives (Radix UI wrappers)
    ├── button.jsx
    ├── input.jsx
    ├── dialog.jsx
    └── [40+ components]
```

### 2. State Management Layer

**Location**: `src/hooks/`, `src/lib/`

#### Server State (TanStack Query)
- Query caching and synchronization
- Automatic refetching and background updates
- Optimistic updates for mutations
- Request deduplication

**Example**:
```javascript
const { data: queries, isLoading } = useQuery({
  queryKey: ['queries', orgId],
  queryFn: () => base44.entities.Query.filter({ org_id: orgId }),
  enabled: !!orgId,
});
```

#### Global UI State (React Context)
- Authentication state (`AuthContext`)
- Theme preferences
- Navigation tracking
- User session management

### 3. Business Logic Layer

**Location**: `src/utils/`, `src/hooks/`, `src/lib/`

Contains:
- Custom React hooks
- Utility functions
- Validation schemas
- Business rule implementations
- Helper functions

### 4. Data Access Layer

**Location**: `src/api/`

#### Base44 Client
```javascript
// src/api/base44Client.js
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
});
```

## Data Flow

### Query Processing Flow

```
User Input → CommandInput Component
    ↓
Validation (Zod Schema)
    ↓
React Query Mutation
    ↓
Base44 SDK API Call
    ↓
Base44 Backend Processing
    ├── Context Gathering (Integrations)
    ├── Knowledge Base Lookup
    ├── AI/LLM Processing
    └── Response Generation
    ↓
Database Update (Query Entity)
    ↓
React Query Cache Update
    ↓
UI Update (ResponseCard)
    ↓
Audit Log Entry
```

### Authentication Flow

```
User Opens App
    ↓
AuthProvider Initialization
    ↓
Check Public Settings (base44.app.getPublicSettings())
    ↓
Check User Auth (base44.auth.me())
    ├── Not Authenticated → Redirect to Login
    ├── User Not Registered → Show Registration Error
    └── Authenticated → Load User Data
    ↓
Fetch User Memberships
    ↓
Load Organization Data
    ↓
Render Application
```

## Key Components

### Core Entities (Base44 Database)

The application uses 8 main Base44 entities:

#### 1. **Organization**
```javascript
{
  id: string,
  name: string,
  plan: string,  // 'free', 'pro', 'enterprise'
  settings: object,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 2. **Membership**
```javascript
{
  id: string,
  org_id: string,
  user_email: string,
  role: string,  // 'owner', 'admin', 'member'
  status: string,  // 'active', 'pending', 'suspended'
  invited_by: string,
  created_date: timestamp
}
```

#### 3. **Query**
```javascript
{
  id: string,
  org_id: string,
  prompt: string,
  response: string,
  response_type: string,  // 'summary', 'action', 'analysis', 'answer'
  status: string,  // 'processing', 'completed', 'failed'
  latency_ms: number,
  is_saved: boolean,
  context_used: array,  // Integration data used
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 4. **KnowledgeBase**
```javascript
{
  id: string,
  org_id: string,
  title: string,
  content: string,
  type: string,  // 'document', 'url', 'api'
  is_active: boolean,
  metadata: object,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 5. **Integration**
```javascript
{
  id: string,
  org_id: string,
  type: string,  // 'slack', 'github', 'custom'
  status: string,  // 'active', 'inactive', 'error'
  config: object,  // Integration-specific configuration
  last_sync: timestamp,
  created_date: timestamp
}
```

#### 6. **Approval**
```javascript
{
  id: string,
  org_id: string,
  query_id: string,
  status: string,  // 'pending', 'approved', 'rejected'
  reviewer_email: string,
  notes: string,
  created_date: timestamp,
  reviewed_date: timestamp
}
```

#### 7. **AuditLog**
```javascript
{
  id: string,
  org_id: string,
  user_email: string,
  action: string,
  entity_type: string,
  entity_id: string,
  details: object,
  ip_address: string,
  created_date: timestamp
}
```

#### 8. **BackgroundJob**
```javascript
{
  id: string,
  org_id: string,
  type: string,
  status: string,  // 'queued', 'running', 'completed', 'failed'
  progress: number,
  result: object,
  error: string,
  created_date: timestamp,
  updated_date: timestamp
}
```

## Design Patterns

### 1. Component Composition

Components are composed from smaller, reusable pieces:

```javascript
// Layout composition
<Layout>
  <Header />
  <Sidebar>
    <Navigation />
    <UserProfile />
  </Sidebar>
  <Main>
    <Page />
  </Main>
</Layout>
```

### 2. Custom Hooks Pattern

Encapsulate reusable logic in custom hooks:

```javascript
// useAuth hook (src/lib/AuthContext.jsx)
const { user, isLoadingAuth, authError, navigateToLogin } = useAuth();
```

### 3. Render Props Pattern

Flexible component composition for conditional rendering:

```javascript
<QueryClient>
  {({ data, isLoading, error }) => (
    isLoading ? <Spinner /> : <DataDisplay data={data} />
  )}
</QueryClient>
```

### 4. Compound Components

Related components that work together:

```javascript
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>Title</DialogHeader>
    <DialogDescription>Description</DialogDescription>
    <DialogFooter>Actions</DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. HOC Pattern (Layout Wrapper)

Higher-order component for consistent page layouts:

```javascript
const LayoutWrapper = ({ children, currentPageName }) => 
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : children;
```

### 6. Provider Pattern

Context-based state management:

```javascript
<AuthProvider>
  <QueryClientProvider>
    <App />
  </QueryClientProvider>
</AuthProvider>
```

## Scalability Considerations

### Current Architecture

**Strengths**:
- Serverless backend scales automatically
- Client-side rendering reduces server load
- Base44 handles infrastructure scaling
- React Query caching reduces API calls
- Component-based architecture allows parallel development

**Limitations**:
- No server-side rendering (SSR) for SEO
- Client-side state doesn't persist across sessions
- No offline support
- Large bundle size as app grows

### Scaling Strategies

#### Short-term (0-10k users)
- ✅ Current architecture sufficient
- Implement code splitting for route-based lazy loading
- Add service worker for offline support
- Optimize bundle size with tree-shaking

#### Medium-term (10k-100k users)
- Implement SSR/SSG with Next.js or similar
- Add CDN for static assets
- Implement advanced caching strategies
- Add real-time updates via WebSockets
- Implement background job processing

#### Long-term (100k+ users)
- Microservices architecture for backend
- Separate API gateway
- Implement event-driven architecture
- Add message queues for async processing
- Multi-region deployment
- Advanced monitoring and observability

### Performance Optimization

#### Current Optimizations
- React Query caching
- Component memoization where needed
- Lazy loading for code splitting
- Debounced search inputs
- Optimistic UI updates

#### Planned Optimizations
- Virtual scrolling for large lists
- Image lazy loading and optimization
- Bundle splitting per route
- Service worker caching
- Compression (gzip/brotli)

## Security Architecture

### Authentication & Authorization

**Current Implementation**:
- Base44 SDK handles authentication
- Organization-based access control
- Membership verification for all operations
- Session management via Base44

**Future Enhancements**:
- Role-based access control (RBAC)
- Fine-grained permissions
- Multi-factor authentication (MFA)
- API key management
- OAuth integration

### Data Security

**Current Measures**:
- HTTPS for all communications
- Environment variables for sensitive config
- No credentials in source code
- Input validation with Zod
- React's built-in XSS protection

**Future Enhancements**:
- Data encryption at rest
- End-to-end encryption for sensitive data
- Regular security audits
- Penetration testing
- OWASP compliance

### API Security

**Current Measures**:
- Authentication required via Base44 SDK
- Organization ID validation
- User email verification

**Future Enhancements**:
- Rate limiting per user/org
- Request throttling
- API versioning
- Webhook signature verification
- IP whitelisting (enterprise)

## Error Handling Strategy

### Levels of Error Handling

1. **Component Level**: Try-catch in individual components
2. **Hook Level**: Error states in custom hooks
3. **Query Level**: React Query error handling
4. **Global Level**: Error boundaries for uncaught errors

### Error Display

- **Toast Notifications**: Non-blocking errors (Sonner)
- **Inline Messages**: Form validation errors
- **Error Pages**: 404, 500, unauthorized
- **Error Boundaries**: Fallback UI for crashes

## Monitoring & Observability

### Current State
- Browser console logging
- Audit log table in database
- System health dashboard

### Recommended Additions
- Application Performance Monitoring (APM)
- Error tracking (Sentry, Rollbar)
- Analytics (Mixpanel, Amplitude)
- User session recording
- Real-time monitoring dashboard
- Alerting for critical errors

## Deployment Architecture

### Current Deployment
- Vite builds static files to `dist/`
- Deploy to CDN or static hosting
- Base44 backend deployed separately

### Recommended Infrastructure
```
┌─────────────────────────────────────────────────────────┐
│  CDN (CloudFront/Cloudflare)                            │
│  - Static assets (JS, CSS, images)                      │
│  - Edge caching                                          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Static Hosting (Vercel/Netlify/S3)                     │
│  - SPA hosting                                           │
│  - Automatic deployments                                 │
│  - Preview environments                                  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Base44 Backend                                          │
│  - Serverless functions                                  │
│  - Database                                              │
│  - AI/LLM services                                       │
└─────────────────────────────────────────────────────────┘
```

## Development Workflow

### Local Development
```bash
npm run dev        # Start dev server (Vite)
npm run lint       # Lint code
npm run build      # Build for production
npm run preview    # Preview production build
```

### Continuous Integration
1. Lint check
2. Type check (JSDoc)
3. Build verification
4. Security audit
5. Deploy preview

### Continuous Deployment
1. Merge to main
2. Automated build
3. Deploy to staging
4. Manual testing
5. Deploy to production
6. Smoke tests

## Architecture Decision Records (ADRs)

See `/docs/adr/` directory for detailed architecture decisions:

- **ADR-001**: Use of Base44 as backend platform
- **ADR-002**: React Query for server state management
- **ADR-003**: Tailwind CSS for styling
- **ADR-004**: Radix UI for component primitives
- **ADR-005**: Zod for validation schemas
- **ADR-006**: No TypeScript (JSDoc instead)

## Future Architecture Considerations

### Phase 1 (Q1 2025)
- Add comprehensive testing infrastructure
- Implement RBAC system
- Add WebSocket support for real-time features
- Optimize bundle size with code splitting

### Phase 2 (Q2 2025)
- Migrate to SSR/SSG for better SEO
- Implement offline support
- Add PWA capabilities
- Advanced analytics integration

### Phase 3 (Q3 2025)
- Microservices architecture evaluation
- Multi-region deployment
- Advanced AI features
- Enterprise-grade security

---

**Document Version**: 1.0  
**Last Updated**: December 30, 2024  
**Next Review**: March 30, 2025
