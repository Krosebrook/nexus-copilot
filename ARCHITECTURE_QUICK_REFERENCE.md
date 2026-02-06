# Architecture Quick Reference Card

**Quick guide for understanding the proposed architecture improvements**

---

## 🎯 The Problem (TL;DR)

**Current state**: 
- 500-800 lines of duplicate code
- 0 tests
- Components directly use Base44 SDK (untestable)
- Business logic mixed with UI

**Proposed solution**: 
- Service layer + Custom hooks
- Remove duplication
- Enable testing
- Separate concerns

---

## 📚 Key Documents

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[ARCHITECTURE_ANALYSIS_SUMMARY.md](./ARCHITECTURE_ANALYSIS_SUMMARY.md)** | Executive summary, key findings | 10 min |
| **[ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md)** | Detailed 30-page improvement plan | 45 min |
| **[ARCHITECTURE_VISUAL_GUIDE.md](./ARCHITECTURE_VISUAL_GUIDE.md)** | Visual diagrams and before/after | 15 min |
| **This file** | Quick reference card | 5 min |

---

## 🔍 Top 5 Issues Found

| # | Issue | Impact | Solution | Effort |
|---|-------|--------|----------|--------|
| 1 | Code duplication (10+ files) | 500-800 duplicate lines | `useOrgData()` hook | 2 hours |
| 2 | No tests | Cannot verify changes | Vitest + Testing Library | 12 hours |
| 3 | Tight coupling to SDK | Untestable components | Service layer | 8 hours |
| 4 | Missing abstractions | Poor code reuse | Custom hooks | 6 hours |
| 5 | Mixed concerns | Hard to maintain | Separation of concerns | Ongoing |

---

## 💡 Quick Wins (4 hours total)

### 1. Extract useOrgData Hook (2 hours)
**Impact**: Remove ~500 lines  
**Files**: 10+ pages

### 2. Consolidate Role Definitions (1 hour)
**Impact**: Single source of truth  
**Files**: 3 files

### 3. Fix Unused Imports (30 min)
**Impact**: Clean lint  
**Files**: 20 files

### 4. Update Dependencies (30 min)
**Impact**: Fix 4 security issues  
**Command**: `npm audit fix`

---

## 📊 Before/After Code Example

### Before (Repeated in 10+ files):

```javascript
// 30-40 lines per page
const [currentOrg, setCurrentOrg] = useState(null);

useEffect(() => {
  const fetchUserOrg = async () => {
    try {
      const user = await base44.auth.me();
      const memberships = await base44.entities.Membership.filter({...});
      const orgs = await base44.entities.Organization.filter({...});
      setCurrentOrg(orgs[0]);
    } catch (e) {
      // Error handling
    }
  };
  fetchUserOrg();
}, []);
```

### After (1 line):

```javascript
const { currentOrg, user, loading, error } = useOrgData();
```

**Impact**: 30 lines → 1 line × 10 pages = **~300-500 lines saved**

---

## 🏗️ Proposed Architecture Layers

```
┌────────────────────┐
│  Page Components   │ ← UI only
└────────┬───────────┘
         │ Uses hooks
         ▼
┌────────────────────┐
│   Custom Hooks     │ ← Reusable logic
└────────┬───────────┘
         │ Uses services
         ▼
┌────────────────────┐
│   Service Layer    │ ← API abstraction
└────────┬───────────┘
         │ Thin wrapper
         ▼
┌────────────────────┐
│    Base44 SDK      │ ← Abstracted
└────────────────────┘
```

---

## 📂 New Directory Structure

```
src/
├── services/           # NEW - Business logic
│   ├── OrganizationService.js
│   ├── QueryService.js
│   └── ...
├── hooks/              # EXPANDED - Custom hooks
│   ├── useOrgData.js
│   ├── usePermissions.js
│   └── ...
├── contexts/           # NEW - React contexts
│   └── AuthContext.jsx
├── constants/          # NEW - Shared constants
│   └── roles.js
└── test/               # NEW - Test utilities
    └── utils.jsx
```

---

## ⚡ Implementation Options

### Option A: Minimal
- **Time**: 20-28 hours
- **What**: Service layer + Core hooks
- **Removes**: 500-800 duplicate lines

### Option B: Recommended ⭐
- **Time**: 32-44 hours
- **What**: + Testing infrastructure
- **Adds**: 40%+ test coverage

### Option C: Complete
- **Time**: 44-62 hours
- **What**: + All services + Code quality
- **Result**: Zero tech debt

---

## 🎓 Key Patterns to Learn

### 1. Custom Hook Pattern

```javascript
// hooks/useOrgData.js
export function useOrgData() {
  const [currentOrg, setCurrentOrg] = useState(null);
  // ... fetching logic
  return { currentOrg, user, loading, error };
}

// Usage in components
const { currentOrg, user } = useOrgData();
```

### 2. Service Layer Pattern

```javascript
// services/QueryService.js
export class QueryService {
  constructor(client) {
    this.client = client;
  }
  
  async getQueries(orgId) {
    return this.client.entities.Query.filter({ org_id: orgId });
  }
}

// Usage
import { services } from '@/services';
const queries = await services.query.getQueries(orgId);
```

### 3. Dependency Injection Pattern

```javascript
// services/index.js
import { base44 } from '@/api/base44Client';
import { QueryService } from './QueryService';

export const services = {
  query: new QueryService(base44),  // ← Inject dependency
};

// In tests: Inject mock instead
const mockClient = { entities: { Query: { filter: vi.fn() } } };
const queryService = new QueryService(mockClient);
```

---

## 🧪 Testing Strategy

### Service Tests

```javascript
// services/QueryService.test.js
describe('QueryService', () => {
  it('should fetch queries', async () => {
    const mockClient = {
      entities: { Query: { filter: vi.fn().mockResolvedValue([...]) } }
    };
    const service = new QueryService(mockClient);
    const result = await service.getQueries('org-123');
    expect(result).toHaveLength(1);
  });
});
```

### Hook Tests

```javascript
// hooks/useOrgData.test.js
import { renderHook } from '@testing-library/react';

describe('useOrgData', () => {
  it('should fetch org data', async () => {
    const { result, waitFor } = renderHook(() => useOrgData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentOrg).toBeDefined();
  });
});
```

### Component Tests

```javascript
// components/EmptyState.test.jsx
import { render, screen } from '@testing-library/react';

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
```

---

## 📈 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 0% | 40%+ |
| Duplicate Lines | 500-800 | <100 |
| Custom Hooks | 1 | 6-8 |
| Service Files | 0 | 6-8 |
| Lint Errors | 20 | 0 |
| Security Issues | 4 | 0 |

---

## ⚠️ Risk Level: 🟡 Medium

**Why medium?**
- Large refactoring but incremental approach
- No tests to break
- Parallel implementation (no breaking changes)

**Mitigation:**
- Create new code alongside old
- Migrate one page at a time
- Extensive manual testing
- Keep old code until verified

---

## 🚀 Migration Phases

### Phase 1: Foundation (8-12 hours)
- [ ] Create service layer
- [ ] Create core hooks
- [ ] Improve file organization

### Phase 2: Migration (12-16 hours)
- [ ] Migrate pages to hooks
- [ ] Remove duplication
- [ ] Update components

### Phase 3: Testing (12-16 hours)
- [ ] Setup Vitest
- [ ] Write initial tests
- [ ] CI/CD integration

---

## 🔗 Links

- **Detailed Plan**: [ARCHITECTURE_IMPROVEMENTS.md](./ARCHITECTURE_IMPROVEMENTS.md)
- **Visual Guide**: [ARCHITECTURE_VISUAL_GUIDE.md](./ARCHITECTURE_VISUAL_GUIDE.md)
- **Summary**: [ARCHITECTURE_ANALYSIS_SUMMARY.md](./ARCHITECTURE_ANALYSIS_SUMMARY.md)
- **Current Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## ❓ FAQ

**Q: Will this break existing functionality?**  
A: No, we'll implement changes in parallel and migrate incrementally.

**Q: Can we do this in phases?**  
A: Yes, recommended to do Phases 1-2 first, then Phase 3 later.

**Q: How long will this take?**  
A: 20-44 hours depending on scope (see Options A/B/C above).

**Q: What if we do nothing?**  
A: Tech debt accumulates, harder to maintain, cannot add tests.

**Q: What's the biggest benefit?**  
A: Removing 500-800 lines of duplication + enabling testing.

---

## ✅ Approval Checklist

To proceed, please:

- [ ] Read [ARCHITECTURE_ANALYSIS_SUMMARY.md](./ARCHITECTURE_ANALYSIS_SUMMARY.md)
- [ ] Choose scope option (A, B, or C)
- [ ] Confirm priorities
- [ ] Answer clarification questions
- [ ] Approve plan

---

**Quick Reference Card**  
**Version**: 1.0  
**Last Updated**: February 6, 2026  
**Status**: Ready for approval
