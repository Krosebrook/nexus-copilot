# 🤖 GitHub Copilot Agent — Feature-to-PR Template

> **Optimized for GitHub Copilot agents on github.com and in VS Code**  
> Execute as ONE autonomous PR with full context awareness

---

## 🎯 Mission Statement

**Feature:** `[REQUIRED: Specific feature name]`  
**Outcome:** `[REQUIRED: 1-2 sentences describing user-visible impact]`  
**Scope Level:** `[SELECT ONE: 🔵 Small | 🟢 Medium | 🔴 Large]`

> ⚠️ **STOP**: If any `[REQUIRED]` field above contains placeholders, **ASK** for clarification before proceeding.

---

## 🧭 Core Principles

### 1. **Context-First Execution**
- Always begin with **Step 0: Context Scan**
- Use existing repo patterns (don't invent new ones)
- Respect `.github/copilot-instructions.md` and related docs

### 2. **Clarify Before Coding**
- If **anything** is ambiguous → **Ask up to 5 targeted questions**
- Questions should be:
  - ✅ Specific and actionable
  - ✅ Necessary to prevent rework
  - ❌ Not about trivial naming or formatting

### 3. **Reviewable Changes**
- **One PR only** — no "Part 1 of 3"
- Keep diffs focused and logical
- If scope expands significantly → **Ask** if it should be split

### 4. **Quality Gates Match Scope**
- 🔵 **Small** (bug fixes, typos, minor tweaks): Tests + docs + build passes
- 🟢 **Medium** (new features, API endpoints): All 🔵 + edge cases + security review + integration tests
- 🔴 **Large** (architecture changes, new services): All 🟢 + ADR + observability + performance testing + rollback plan

---

## 📋 Scope-Adaptive Requirements

### 🔵 Small Changes (Bug fixes, config updates, minor improvements)
- [ ] **Tests**: Added or updated for changed behavior
- [ ] **Docs**: Updated if user-visible behavior changes
- [ ] **Build**: `npm run build`, `npm run lint` all pass
- [ ] **Verification**: Manual testing documented in PR

### 🟢 Medium Features (New components, API endpoints, UI flows)
All 🔵 requirements plus:
- [ ] **Edge Cases**: Null/empty/invalid inputs handled gracefully
- [ ] **Error Handling**: No silent failures; user-friendly messages
- [ ] **Security Review**: Input validation, authorization checks if applicable
- [ ] **Integration Tests**: If repo has test infrastructure
- [ ] **Accessibility** (if frontend): ARIA labels, keyboard navigation, focus management
- [ ] **Loading/Error States** (if UI): Skeleton loaders, error boundaries

### 🔴 Large Features (Architecture changes, new services, major refactors)
All 🟢 requirements plus:
- [ ] **Architecture Decision Record (ADR)**: Document why this approach
- [ ] **Observability**: Logging, metrics, tracing added
- [ ] **Performance**: Load tested; no N+1 queries; caching strategy documented
- [ ] **Backward Compatibility**: Migration path for existing users/data
- [ ] **Rollback Plan**: Feature flags or clean revert strategy
- [ ] **Security Deep Dive**: Threat model, secrets management, dependency audit
- [ ] **Documentation**: README, API docs, runbooks updated

---

## 🔄 Required Workflow

### **Step 0: Context Scan** *(Must do first)*

Run these checks and document findings:

#### 0.1 — Repository Configuration
```bash
# Build/test/lint commands
Check: package.json, Makefile, .github/workflows/*
Find: How to build, test, lint, and run locally
```

#### 0.2 — Existing Patterns
For each of these, find **1-2 example files** to use as templates:

| Pattern | What to Find | Where to Look |
|---------|--------------|---------------|
| **Auth** | How is user identity verified? Middleware? Decorators? | Backend functions, API routes |
| **Validation** | Zod? Joi? Manual checks? | Form components, API handlers |
| **Error Handling** | Error classes? Status codes? User messages? | Try/catch blocks, error boundaries |
| **Logging** | What library? What levels? Structured or plain text? | Console.log calls, logger imports |
| **State Management** | Context? Redux? Zustand? React Query? | Hooks, providers |
| **Styling** | Tailwind? CSS Modules? Styled Components? | Component files |
| **Testing** | Jest? Vitest? Testing Library? Cypress? | Test files, test config |

#### 0.3 — Find Reference Implementation
- **For new API endpoint** → Find most similar existing endpoint
- **For new UI component** → Find most similar existing component
- **For new utility function** → Find similar utility
- **List 2-3 files** to use as structural templates

#### 0.4 — CI/CD Constraints
```bash
# Check for:
- Required status checks (.github/workflows/*)
- Branch protection rules
- CODEOWNERS file
- Signed commits requirement
```

**📝 OUTPUT**: Post a summary of findings before proceeding to Step 1

---

### **Step 1: Plan** *(Post before major edits)*

Create a brief plan with:

#### 1.1 — Files to Change
```
- src/components/NewFeature.jsx (NEW)
- src/api/feature-endpoint.js (MODIFY)
- src/hooks/useFeature.js (NEW)
- README.md (MODIFY - document new feature)
- package.json (MODIFY - add dependency X)
```

#### 1.2 — Implementation Strategy
- What's the high-level approach?
- What existing patterns/components will you reuse?
- Any new dependencies needed? Why?

#### 1.3 — Test Plan
```
Unit Tests:
- Test A validates input handling
- Test B validates success path
- Test C validates error cases

Integration Tests (if applicable):
- Test D validates end-to-end flow
```

#### 1.4 — Rollback Plan
- How to safely revert if issues arise?
- Feature flag? Database migration rollback? Simple git revert?

#### 1.5 — Risk Assessment
- **Risk Level**: [Low/Medium/High]
- **Known Risks**: [List 1-3]
- **Mitigations**: [How you'll address each]

**📝 OUTPUT**: Wait for approval/feedback before proceeding to implementation

---

### **Step 2: Implement**

#### Code Quality Checklist
- [ ] Follow existing code style (linter config)
- [ ] Use TypeScript types if repo uses TS
- [ ] Add JSDoc comments for public APIs
- [ ] Keep functions small and single-purpose
- [ ] Extract magic numbers to named constants
- [ ] No hardcoded credentials or secrets
- [ ] Defensive: Check for null/undefined before using

#### Security Checklist
- [ ] **Input Validation**: Validate all user inputs at trust boundaries
- [ ] **Authorization**: Server-side checks for protected operations (never client-only)
- [ ] **Output Encoding**: Escape user content in UI to prevent XSS
- [ ] **Secrets**: Use environment variables, never commit tokens
- [ ] **Dependencies**: Check for known vulnerabilities (`npm audit`)

#### Performance Checklist
- [ ] No unnecessary re-renders (React: useMemo, useCallback)
- [ ] No N+1 queries (batch database calls)
- [ ] Lazy load heavy components/images
- [ ] Add loading states for async operations

---

### **Step 3: Tests**

#### Test Coverage Requirements
- **🔵 Small**: At least 1 test proving the fix works
- **🟢 Medium**: Success path + 2-3 edge cases + 1-2 error cases
- **🔴 Large**: All happy paths + comprehensive edge cases + performance tests

#### Test Quality Checklist
- [ ] Tests are deterministic (no random data, no real timers)
- [ ] Tests are isolated (no shared state between tests)
- [ ] Tests document behavior (readable test names)
- [ ] Mock external dependencies (APIs, databases)
- [ ] Use repo's existing test patterns and utilities

#### Example Test Structure
```javascript
describe('NewFeature', () => {
  describe('Success Cases', () => {
    it('should handle valid input correctly', () => {
      // Arrange, Act, Assert
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input gracefully', () => {});
    it('should handle maximum length input', () => {});
  });

  describe('Error Cases', () => {
    it('should display error message on API failure', () => {});
  });
});
```

---

### **Step 4: Documentation**

#### Required Documentation
- [ ] **README.md**: Update if feature is user-visible or changes setup
- [ ] **Code Comments**: Explain "why" not "what" (what is obvious from code)
- [ ] **API Docs**: Update OpenAPI/Swagger if API changes
- [ ] **Inline Examples**: Add usage examples for complex APIs
- [ ] **Migration Guide**: If breaking change, explain how to upgrade

#### Optional Documentation (if applicable)
- [ ] **ADR**: Architecture Decision Record for significant architectural choices
- [ ] **CHANGELOG.md**: Add entry if repo maintains one
- [ ] **Runbook**: For ops-heavy features (monitoring, incidents)
- [ ] **Diagrams**: Architecture or sequence diagrams for complex flows

---

### **Step 5: PR Description**

Use this template for your pull request:

```markdown
## 📝 Summary
[2-3 sentences: what changed and why]

## 🎯 Related Issue
Closes #[issue-number]  
[Or: No related issue — this is a proactive improvement]

## 🔧 Changes Made

### Added
- [List new files, features, or capabilities]

### Modified
- [List changed files and what changed]

### Removed
- [List deleted files or deprecated features]

## ✅ Verification

### Local Testing
```bash
# Build
npm run build

# Lint
npm run lint

# Manual testing
npm run dev
# Then: [describe manual test steps]
```

### Expected Output
```
✓ Build succeeds
✓ Lint passes with 0 errors
```

## 🔒 Security Review

- [ ] **CodeQL**: [Passed / N/A / Not yet run]
- [ ] **Dependency Scan**: [No new vulnerabilities / X new vulnerabilities - justified because...]
- [ ] **Secret Scanning**: [Passed / N/A]
- [ ] **Manual Review**: [Describe any security-sensitive changes]

## ⚖️ Risk Assessment

**Risk Level**: [🟢 Low / 🟡 Medium / 🔴 High]

**Potential Risks**:
1. [Risk 1]
2. [Risk 2]

**Mitigations**:
1. [Mitigation for Risk 1]
2. [Mitigation for Risk 2]

**Rollback Plan**:
[Describe how to safely revert these changes]

## 📸 Screenshots / Demo
[If UI change: Add before/after screenshots or GIF]
[If API change: Add example requests/responses]

## ✨ Additional Context
[Any other information reviewers should know]

---

## Reviewer Checklist
- [ ] Code follows repo conventions
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No security concerns
- [ ] Performance is acceptable
- [ ] Changes are backward compatible (or migration path is clear)
```

---

## 🚨 Troubleshooting Guide

| Problem | Solution |
|---------|----------|
| **CI fails on unrelated tests** | Document in PR; consider if your change could have side effects |
| **Merge conflicts appear** | Rebase onto latest main: `git pull --rebase origin main` |
| **Scope grows during implementation** | **STOP** and ask: "This is expanding to include X. Should this be a separate PR?" |
| **No existing test infrastructure** | **Ask**: "This repo has no tests. Should I set up testing (Vitest/Jest) or skip?" |
| **Dependency unavailable in tests** | Mock it; document in "Known Limitations" |
| **Performance concern** | Measure with profiler; document findings; add performance test |
| **Security vulnerability in new dep** | **Ask**: "Dependency X has vulnerability Y. Acceptable risk or find alternative?" |

---

## 📊 Stack-Specific Guidance

<details>
<summary><b>🎨 Frontend (React/Vue/Svelte)</b></summary>

### Additional Requirements
- [ ] **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- [ ] **Responsive Design**: Test mobile, tablet, desktop
- [ ] **Loading States**: Skeletons, spinners, or progress indicators
- [ ] **Error Boundaries**: Catch and display React errors gracefully
- [ ] **Performance**: Monitor bundle size, lazy load heavy components

### Testing
- [ ] **Component tests**: React Testing Library or similar
- [ ] **Visual regression**: Storybook or Chromatic (if repo uses)
- [ ] **E2E tests**: Cypress, Playwright (for critical flows)

### Patterns to Follow
- Use existing component library (Radix UI, MUI, etc.)
- Follow existing state management patterns
- Match existing styling approach (Tailwind, CSS Modules, etc.)

</details>

<details>
<summary><b>⚙️ Backend (Node.js/Python/Go)</b></summary>

### Additional Requirements
- [ ] **API Documentation**: OpenAPI/Swagger updated
- [ ] **Rate Limiting**: Consider for public endpoints
- [ ] **Database Migrations**: Include migration scripts
- [ ] **Backward Compatibility**: Don't break existing clients
- [ ] **Idempotency**: POST/PUT endpoints should be safe to retry

### Testing
- [ ] **Unit tests**: Pure business logic
- [ ] **Integration tests**: API endpoints with test database
- [ ] **Contract tests**: If microservices, verify API contracts

### Patterns to Follow
- Use existing ORM/database library
- Follow existing authentication/authorization patterns
- Match existing error response format

</details>

<details>
<summary><b>🏗️ Infrastructure / DevOps</b></summary>

### Additional Requirements
- [ ] **IaC Updated**: Terraform, CloudFormation, etc.
- [ ] **Runbook Created**: How to deploy, rollback, troubleshoot
- [ ] **Monitoring**: Alerts, dashboards, SLOs defined
- [ ] **Cost Impact**: Estimate additional cloud costs
- [ ] **Security**: IAM policies, network rules, encryption

### Testing
- [ ] **Plan/dry-run**: Verify Terraform plan before apply
- [ ] **Staging deployment**: Test in non-prod first
- [ ] **Smoke tests**: Verify basic functionality post-deploy

</details>

<details>
<summary><b>📱 Mobile (React Native / Flutter)</b></summary>

### Additional Requirements
- [ ] **iOS & Android**: Test on both platforms
- [ ] **Offline Support**: Handle network loss gracefully
- [ ] **App Store Guidelines**: Comply with iOS/Android policies
- [ ] **Permissions**: Request minimal necessary permissions
- [ ] **Deep Linking**: If applicable, test deep links

### Testing
- [ ] **Unit tests**: Business logic
- [ ] **Component tests**: UI components in isolation
- [ ] **E2E tests**: Detox, Maestro, or Appium

</details>

---

## 🎯 Scope Definition Template

### ✅ In Scope
- [Specific feature/component/capability 1]
- [Specific feature/component/capability 2]
- [Specific feature/component/capability 3]

### ❌ Explicitly Out of Scope
- [Related feature that's NOT included]
- [Edge case that will be handled separately]
- [Refactor that's deferred to future PR]

### 🔮 Future Work (Mentioned for context)
- [Follow-up PR idea 1]
- [Follow-up PR idea 2]

---

## 📚 Repository-Specific Context

### This Repository: `Krosebrook/nexus-copilot`

**Tech Stack**:
- **Frontend**: React 18 + Vite 6 + Tailwind CSS + Radix UI
- **Backend**: Base44 SDK (serverless functions)
- **State**: React hooks, Context API, and TanStack Query (React Query)
- **Routing**: React Router v6
- **UI Library**: Radix UI primitives with custom Tailwind styling
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Toast Notifications**: Sonner

**Key Patterns**:
- **Auth**: Base44 authentication (`base44.auth.me()`, `AuthProvider` context)
- **Data Fetching**: TanStack Query (`useQuery`, `useMutation`)
- **Validation**: Zod schemas with React Hook Form
- **Styling**: Tailwind utility classes with custom theme + CSS variables
- **Components**: Radix UI primitives + custom wrappers in `src/components/ui`
- **State Management**: React Query for server state, Context API for global UI state
- **Error Handling**: Toast notifications (Sonner) + error boundaries

**Application Structure**:
- **8 main pages**: Dashboard, Copilot, Knowledge, Approvals, Docs, Settings, SystemHealth, Onboarding
- **65+ components**: Organized by feature (admin, copilot, shared, ui)
- **Base44 Entities**: Query, Organization, Membership, Integration, KnowledgeBase, AuditLog
- **AI Integration**: Base44 Core LLM integration with context awareness

**Known Constraints**:
- ⚠️ **No test infrastructure**: Testing needs to be set up (consider Vitest for unit tests)
- ⚠️ **JavaScript only**: No TypeScript (jsconfig.json for IDE support)
- ⚠️ **8 security vulnerabilities**: Documented in npm audit (6 moderate, 2 high)
- ⚠️ **20 ESLint errors**: Unused imports need cleanup

**Build Commands**:
```bash
npm run dev       # Development server (Vite)
npm run build     # Production build
npm run lint      # ESLint check (--quiet flag)
npm run lint:fix  # Auto-fix ESLint issues
npm run typecheck # TypeScript checking via JSConfig
npm run preview   # Preview production build
```

**Required Reading** (check these first):
- `.github/copilot-instructions.md` (this file)
- `README.md` (setup instructions)
- `package.json` (dependencies and scripts)
- `src/pages.config.js` (page routing configuration)

**Helpful Context**:
- AI-powered copilot for teams with query history
- Integration support (Slack, GitHub, etc.)
- Knowledge base management
- Audit logging for compliance
- Organization-based multi-tenancy
- Real-time query processing with context awareness

**Environment Variables Required**:
```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

---

## 🚀 Execution Checklist

Before starting:
- [ ] All `[REQUIRED]` fields are filled
- [ ] Scope level (🔵/🟢/🔴) is selected
- [ ] I understand what success looks like

During execution:
- [ ] Completed Step 0: Context Scan
- [ ] Posted Step 1: Plan and received approval
- [ ] Followed existing repo patterns
- [ ] Added appropriate tests (or documented why skipped)
- [ ] Updated documentation
- [ ] Created comprehensive PR description

Before submitting PR:
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manually tested the feature
- [ ] Reviewed own code changes
- [ ] No secrets or credentials in code
- [ ] PR description is complete

---

## ✨ Example: Good vs. Ambiguous Feature Definitions

### ❌ Too Ambiguous
```
Feature: Add search
Outcome: Users can search
```
**Why bad**: What can they search? Where? What happens with results?

### ✅ Good Definition
```
Feature: Query search with filters in Copilot history
Outcome: Users can search their query history by text and filter by 
status (completed/processing), response type (summary/action/analysis/answer), 
and saved status. Results update in real-time with highlighting.

Scope Level: 🟢 Medium

Acceptance Criteria:
- [ ] Search input with debounced updates (300ms)
- [ ] Filter by status, response type, and saved status
- [ ] Search terms are highlighted in query text
- [ ] "No results" state with helpful message
- [ ] Works in sidebar query history component
- [ ] Persists filter state in URL params
```

---

## 🎓 Agent Learning Notes

### Common Pitfalls to Avoid
1. **Don't guess patterns** — always check existing code first
2. **Don't skip Step 0** — context scan prevents rework
3. **Don't over-engineer** — match existing complexity level
4. **Don't ignore CI failures** — they're trying to tell you something
5. **Don't mix concerns** — one PR = one logical change

### Signs You Should Ask Questions
- Multiple ways to implement something and no clear "right" way
- Security implications you're unsure about
- Performance impact that's hard to estimate
- Breaking changes that might affect users
- Scope that feels too large for one PR

### Signs You're on the Right Track
- Your plan closely mirrors an existing feature
- You're reusing existing components/utilities
- Build and lint pass locally
- Code diff is focused and readable
- You can explain the rollback plan clearly

---

## 📞 Need Help?

If stuck or unsure:
1. **Check documentation**: README.md, this file, package.json
2. **Look for similar code**: Find reference implementation
3. **Ask specific questions**: "Should I use pattern A or B?" not "What should I do?"
4. **Propose a solution**: "I'm planning X because Y. Thoughts?" gets faster feedback

---

**Version**: 2.0  
**Last Updated**: 2025-12-30  
**Optimized for**: GitHub Copilot agents (github.com + VS Code)  
**Repository**: Krosebrook/nexus-copilot
