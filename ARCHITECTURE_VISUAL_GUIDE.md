# Architecture Visualization

This document provides visual representations of the current and proposed architectures.

---

## Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                      Page Components                         │
│  (Copilot, Knowledge, AgentBuilder, WorkflowBuilder, etc.)  │
│                                                              │
│  Each page contains:                                         │
│  • Direct Base44 SDK imports                                 │
│  • Duplicate user/org fetching (30+ lines)                   │
│  • Duplicate membership logic                                │
│  • Direct entity queries                                     │
│  • Mixed UI + business logic                                 │
│                                                              │
│  ❌ 10+ pages × 30-40 duplicate lines = 300-400 lines       │
│  ❌ Cannot be unit tested                                    │
│  ❌ Hard to maintain consistency                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Direct SDK calls
                   │ (50+ components)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Base44 SDK                                │
│                  (Tightly Coupled)                           │
│                                                              │
│  • base44.auth.me()                                          │
│  • base44.entities.Membership.filter()                      │
│  • base44.entities.Organization.filter()                    │
│  • base44.entities.Query.filter()                           │
└─────────────────────────────────────────────────────────────┘
```

### Problems:
- 🔴 **500-800 lines of duplicate code** across pages
- 🔴 **0 test coverage** - Cannot mock SDK
- 🔴 **Tight coupling** - Components depend on SDK directly
- 🔴 **No separation of concerns** - UI + business logic mixed
- 🔴 **Hard to maintain** - Changes require updating 10+ files

---

## Proposed Architecture (After)

```
┌─────────────────────────────────────────────────────────────┐
│                      Page Components                         │
│  (Copilot, Knowledge, AgentBuilder, WorkflowBuilder, etc.)  │
│                                                              │
│  Clean components with:                                      │
│  • const { currentOrg, user } = useOrgData()    (1 line!)   │
│  • const { can } = usePermissions()             (1 line!)   │
│  • Only UI logic                                             │
│                                                              │
│  ✅ 10+ pages × 1-2 lines = ~15-20 lines total              │
│  ✅ Testable (hooks can be mocked)                           │
│  ✅ Consistent behavior                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │ Uses custom hooks
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks Layer                        │
│                   (Reusable Logic)                           │
│                                                              │
│  • useOrgData()         - User/org fetching                  │
│  • usePermissions()     - Permission checks                  │
│  • useQueryMutations()  - Query CRUD operations              │
│  • useEntityMetadata()  - Entity metadata                    │
│                                                              │
│  ✅ Reusable across components                               │
│  ✅ Testable independently                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │ Uses services
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│                (Business Logic + API Abstraction)            │
│                                                              │
│  • OrganizationService  - Org/membership operations          │
│  • QueryService         - Query CRUD                         │
│  • UserService          - User operations                    │
│  • KnowledgeBaseService - Knowledge operations               │
│  • WorkflowService      - Workflow operations                │
│  • IntegrationService   - Integration operations             │
│                                                              │
│  ✅ Single place for API calls                               │
│  ✅ Mockable for testing                                     │
│  ✅ Centralized error handling                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ Thin wrapper
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Base44 SDK                                │
│                  (Abstracted)                                │
│                                                              │
│  • Only accessed via service layer                           │
│  • Can be swapped/mocked easily                              │
└─────────────────────────────────────────────────────────────┘
```

### Benefits:
- ✅ **500-800 lines removed** - Consolidated into hooks
- ✅ **40%+ test coverage** - Services and hooks testable
- ✅ **Loose coupling** - Easy to change implementations
- ✅ **Clear separation** - UI, logic, and data access separated
- ✅ **Easy maintenance** - Update logic in one place

---

## Code Flow Comparison

### Before: Getting Organization Data

```
┌──────────────┐
│   Page.jsx   │
│              │
│  useState()  │  ← Manual state
│  useEffect() │  ← Fetch logic (30+ lines)
│    ↓         │
│  base44.auth │  ← Direct SDK call
│    .me()     │
│    ↓         │
│  base44      │  ← Direct SDK call
│  .entities   │
│  .Membership │
│  .filter()   │
│    ↓         │
│  base44      │  ← Direct SDK call
│  .entities   │
│  .Org.filter│
│    ↓         │
│  setOrg()    │  ← Manual state update
└──────────────┘

Repeated in 10+ files
```

### After: Getting Organization Data

```
┌──────────────┐
│   Page.jsx   │
│              │
│  useOrgData()│  ← 1 line!
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  useOrgData()    │  ← Custom hook
│    ↓             │
│  services        │
│  .organization   │
│  .getCurrent()   │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│  OrganizationService │  ← Service layer
│    ↓                 │
│  base44.auth.me()    │
│    ↓                 │
│  base44.entities     │
│  .Membership.filter()│
│    ↓                 │
│  base44.entities     │
│  .Organization       │
│  .filter()           │
└──────────────────────┘

Used once, reused everywhere
```

---

## File Structure Transformation

### Before

```
src/
├── api/
│   └── base44Client.js           ← Only initialization
│
├── hooks/
│   └── use-mobile.jsx            ← Only 1 hook!
│
├── lib/
│   ├── AuthContext.jsx           ← Mixed concerns
│   ├── NavigationTracker.jsx
│   └── utils.js
│
├── pages/
│   ├── Copilot.jsx               ← 30-40 lines duplicate
│   ├── Knowledge.jsx             ← 30-40 lines duplicate
│   ├── AgentBuilder.jsx          ← 30-40 lines duplicate
│   ├── WorkflowBuilder.jsx       ← 30-40 lines duplicate
│   └── ... (10+ pages)           ← All with duplicates
│
└── components/
    └── ... (148 files)
```

### After

```
src/
├── api/
│   └── base44Client.js           ← SDK initialization
│
├── services/                      ← NEW: Business logic
│   ├── index.js                  ← Service factory
│   ├── OrganizationService.js    ← Org operations
│   ├── QueryService.js           ← Query operations
│   ├── UserService.js            ← User operations
│   ├── KnowledgeBaseService.js   ← Knowledge operations
│   ├── WorkflowService.js        ← Workflow operations
│   └── IntegrationService.js     ← Integration operations
│
├── hooks/                         ← EXPANDED: Reusable logic
│   ├── use-mobile.jsx            ← Existing
│   ├── useOrgData.js             ← NEW: Org/user fetching
│   ├── usePermissions.js         ← NEW: Permission checks
│   ├── useQueryMutations.js      ← NEW: Query operations
│   ├── useEntityMetadata.js      ← NEW: Entity metadata
│   └── useKnowledgeMutations.js  ← NEW: Knowledge operations
│
├── contexts/                      ← NEW: React contexts
│   ├── AuthContext.jsx           ← Moved from lib/
│   └── ThemeContext.jsx          ← If needed
│
├── constants/                     ← NEW: Shared constants
│   ├── roles.js                  ← Role definitions
│   ├── queryKeys.js              ← TanStack Query keys
│   └── routes.js                 ← Route paths
│
├── lib/                           ← CLEANED UP
│   ├── query-client.js           ← TanStack Query config
│   ├── app-params.js             ← App parameters
│   └── utils.js                  ← General utilities
│
├── test/                          ← NEW: Test utilities
│   ├── setup.js                  ← Test configuration
│   ├── utils.jsx                 ← Render helpers
│   └── mocks.js                  ← Mock services
│
├── pages/
│   ├── Copilot.jsx               ← 1-2 lines (hook usage)
│   ├── Knowledge.jsx             ← 1-2 lines (hook usage)
│   ├── AgentBuilder.jsx          ← 1-2 lines (hook usage)
│   ├── WorkflowBuilder.jsx       ← 1-2 lines (hook usage)
│   └── ... (10+ pages)           ← All simplified
│
└── components/
    └── ... (148 files)           ← Cleaner, focused
```

---

## Testing Strategy Visualization

### Before: Untestable

```
Cannot test components because:

┌──────────────┐
│  Component   │ ❌ Cannot mock base44 SDK
│      ↓       │
│  base44.auth │ ❌ Requires real backend
│      ↓       │
│  base44      │ ❌ Network calls in tests
│  .entities   │
└──────────────┘

Result: 0 tests
```

### After: Fully Testable

```
Can test at every layer:

┌──────────────┐
│  Component   │ ✅ Mock custom hooks
│      ↓       │
│  useOrgData()│ ✅ Mock services
│      ↓       │
│  Org Service │ ✅ Mock SDK client
│      ↓       │
│  base44 SDK  │ ✅ Not needed in tests
└──────────────┘

Result: 40%+ coverage
```

---

## Migration Strategy Visualization

### Phase 1: Create Parallel Infrastructure

```
Old Code (Keep)          New Code (Add)
┌──────────┐             ┌──────────┐
│ Pages    │             │ Services │  ← Create
│   +      │             │    +     │
│ Direct   │             │  Hooks   │  ← Create
│ SDK      │             │          │
└──────────┘             └──────────┘
     ↓                        ↓
     └────── Both Work ───────┘
```

### Phase 2: Migrate Pages One by One

```
Page 1 → Use new hooks ✅
Page 2 → Use new hooks ✅
Page 3 → Use new hooks ✅
...
Page 10+ → Use new hooks ✅

Old duplication removed as pages migrate
```

### Phase 3: Clean Up

```
┌──────────┐             ┌──────────┐
│ Old Code │ ← Delete    │ New Code │ ← Keep
│ (unused) │             │ Services │
│          │             │  Hooks   │
└──────────┘             │  Tests   │
                         └──────────┘
```

---

## Impact Metrics Visualization

### Code Reduction

```
Before:  ████████████████████████ 500-800 duplicate lines
After:   ██ < 100 lines

Reduction: ~85-90%
```

### Test Coverage

```
Before:  ░░░░░░░░░░░░░░░░░░░░░░░░ 0%
After:   ██████████░░░░░░░░░░░░░░ 40%+

Increase: +40 percentage points
```

### Developer Experience

```
Feature: Add new page with org data

Before:  ████████████████████ 30-40 lines duplicate
After:   ██ 1 line (useOrgData hook)

Time saved: 15-20 minutes per feature
```

---

## Summary

The proposed architecture provides:

✅ **85-90% reduction** in duplicate code  
✅ **40%+ test coverage** (from 0%)  
✅ **Clear separation** of concerns  
✅ **Testable** components and services  
✅ **Maintainable** codebase with single source of truth  
✅ **Scalable** patterns for future growth  

All while maintaining existing functionality with zero breaking changes.

---

**Visual Aid Document**  
**Version**: 1.0  
**Last Updated**: February 6, 2026
