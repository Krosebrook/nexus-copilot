# Contributing to Nexus Copilot

First off, thank you for considering contributing to Nexus Copilot! It's people like you that make Nexus Copilot such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@nexuscopilot.com.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A Base44 account and app configuration

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nexus-copilot.git
   cd nexus-copilot
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Krosebrook/nexus-copilot.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Base44 credentials
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Verify setup**
   - Open http://localhost:5173
   - You should see the Nexus Copilot interface

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find that you don't need to create one. When creating a bug report, please include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. macOS 14.0]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 0.1.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most Nexus Copilot users
- **List any similar features** in other applications
- **Include mockups or examples** if applicable

### Your First Code Contribution

Unsure where to begin? Look for issues tagged with:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Improvements to documentation

### Pull Requests

1. **Create a branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Follow the [Style Guidelines](#style-guidelines)
   - Add or update tests if applicable (currently no test infrastructure)
   - Update documentation as needed

3. **Lint your code**
   ```bash
   npm run lint
   npm run lint:fix  # Auto-fix issues
   ```

4. **Build and test**
   ```bash
   npm run build
   npm run typecheck
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

## Style Guidelines

### JavaScript Style Guide

We use ESLint to maintain code quality. Key conventions:

**General**
- Use functional components with hooks (no class components)
- Prefer `const` over `let`, avoid `var`
- Use destructuring for props and state
- Keep components small and focused (under 300 lines)
- Use meaningful variable names

**React Patterns**
```jsx
// ✅ Good
const UserProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Effect for side effects
  useEffect(() => {
    // ...
  }, [dependencies]);
  
  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
};

// ❌ Avoid
function UserProfile(props) {
  const [isEditing, setIsEditing] = React.useState(false);
  // ...
}
```

**Imports**
```javascript
// Order: React, external libraries, internal modules, components, utilities
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils';
```

**Component Organization**
1. Imports
2. Type definitions (if using TypeScript/JSDoc)
3. Component function
4. State declarations
5. Computed values
6. Effects
7. Event handlers
8. Render logic
9. Exports

**Styling**
- Use Tailwind CSS utility classes
- Follow existing Tailwind patterns in the codebase
- Use `cn()` utility for conditional classes
- Keep color scheme consistent (slate palette for neutrals)

```jsx
// ✅ Good
<Button 
  className={cn(
    "px-4 py-2 rounded-lg",
    isActive && "bg-slate-900 text-white",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  Click me
</Button>
```

**State Management**
- Use React Query for server state
- Use Context API for global UI state
- Keep local state when possible
- Avoid prop drilling (use composition or context)

**Error Handling**
```javascript
// ✅ Good - User-friendly error handling
try {
  const result = await base44.entities.Query.create(data);
  toast.success('Query created successfully');
  return result;
} catch (error) {
  console.error('Failed to create query:', error);
  toast.error('Failed to create query. Please try again.');
  throw error;
}
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)
- **Pages**: PascalCase (e.g., `Dashboard.jsx`)

### Directory Structure

```
src/
├── api/              # API client configuration
├── components/
│   ├── admin/        # Admin-specific components
│   ├── copilot/      # Copilot feature components
│   ├── shared/       # Shared/common components
│   └── ui/           # UI primitives (buttons, inputs, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Library code (utils, helpers)
├── pages/            # Page components
└── utils/            # Utility functions
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `ci`: CI/CD changes

### Examples

```bash
feat(copilot): add real-time collaboration support

Implement websocket connection for multi-user query sessions.
Users can now see live updates when other team members are typing.

Closes #123

---

fix(dashboard): resolve query count calculation error

The dashboard was showing incorrect query counts due to timezone
handling. Fixed by normalizing all dates to UTC.

Fixes #456

---

docs(readme): add deployment instructions

Added comprehensive deployment guide including environment
variable configuration and hosting options.
```

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if applicable)
- [ ] No ESLint errors
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] PR description is complete and clear

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issue
Closes #(issue number)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested your changes:
1. Step 1
2. Step 2
3. Step 3

## Screenshots (if applicable)
Add screenshots to demonstrate the changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes
```

### Review Process

1. **Automated Checks**: ESLint and build must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing verification
4. **Approval**: Maintainer approval before merge
5. **Merge**: Squash and merge to main branch

### Addressing Review Comments

- Be open to feedback
- Respond to all comments
- Make requested changes promptly
- Mark conversations as resolved when addressed
- Request re-review after changes

## Development Workflow

### Syncing Your Fork

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main into your local main
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

### Working with Branches

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: my awesome feature"

# Keep your branch updated
git fetch upstream
git rebase upstream/main

# Push to your fork
git push origin feature/my-feature
```

## Project-Specific Guidelines

### Base44 SDK Usage

When working with Base44 entities:

```javascript
// ✅ Good - Proper error handling
const { data: queries, isLoading, error } = useQuery({
  queryKey: ['queries', orgId],
  queryFn: async () => {
    if (!orgId) throw new Error('Organization ID required');
    return base44.entities.Query.filter({ org_id: orgId }, '-created_date', 100);
  },
  enabled: !!orgId,
});

// Handle loading and error states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### Adding New Pages

1. Create page component in `src/pages/`
2. Add to `src/pages.config.js`:
   ```javascript
   import MyPage from './pages/MyPage';
   
   export const PAGES = {
     // ...existing pages
     "MyPage": MyPage,
   }
   ```
3. Update navigation in `Layout.jsx` if needed

### Adding New Components

1. Choose appropriate directory (admin, copilot, shared, ui)
2. Use existing components as templates
3. Follow Radix UI patterns for UI primitives
4. Add proper prop validation with JSDoc comments

```javascript
/**
 * Display a stat card with icon, label, value, and optional change indicator
 * @param {Object} props
 * @param {string} props.label - The stat label
 * @param {string|number} props.value - The stat value
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} [props.change] - Optional change percentage
 * @param {string} [props.trend] - Trend direction: 'up' or 'down'
 */
export default function StatsCard({ label, value, icon: Icon, change, trend }) {
  // Component implementation
}
```

## Testing (Future)

Currently, there is no test infrastructure. When tests are added, contributors should:

- Write unit tests for utilities
- Write component tests for UI components
- Write integration tests for complex flows
- Maintain >80% code coverage for new code
- Run tests before submitting PR

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Adding configuration options
- Fixing bugs that affect usage
- Improving performance significantly

### Where to Update

- **README.md**: Setup, basic usage, troubleshooting
- **ARCHITECTURE.md**: System design, technical decisions
- **API_DOCUMENTATION.md**: API endpoints, entities, methods
- **Code Comments**: Complex logic, non-obvious behavior
- **.github/copilot-instructions.md**: GitHub Copilot agent guidelines

## Community

### Getting Help

- 💬 **GitHub Discussions**: For questions and general discussion
- 🐛 **GitHub Issues**: For bug reports and feature requests
- 📧 **Email**: support@nexuscopilot.com for private inquiries

### Recognition

We value all contributions! Contributors will be:

- Listed in the project's contributors page
- Mentioned in release notes for significant contributions
- Eligible for contributor badges and swag (when available)

## License

By contributing to Nexus Copilot, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

**Thank you for contributing to Nexus Copilot!** 🚀

Your efforts help make AI-powered copilot technology more accessible and powerful for everyone.
