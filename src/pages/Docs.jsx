import React, { useState } from 'react';
import { 
  Book, Layout, Database, Shield, Wrench, 
  HelpCircle, ChevronRight, Search
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

const DOCS_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    icon: Book,
    content: `
# Platform Overview

Welcome to the AI Copilot platform documentation. This enterprise-ready platform helps teams think faster and stay aligned through AI-powered insights and collaboration.

## Key Features

- **AI-Powered Queries**: Ask questions in natural language and get instant, actionable responses
- **Multi-Tenant Architecture**: Secure workspace isolation with role-based access control
- **Audit Logging**: Complete audit trail for compliance and security
- **Integrations**: Connect with your existing tools and workflows
- **Approval Workflows**: Governance controls for sensitive operations

## Getting Started

1. **Create your workspace**: Set up your organization and invite team members
2. **Configure roles**: Assign appropriate permissions to team members
3. **Start asking**: Use the Copilot interface to get instant answers
4. **Review insights**: Track patterns and save important responses

## Quick Links

- [Architecture](#architecture)
- [Data Model](#data-model)
- [Security](#security)
- [Operations](#operations)
`
  },
  {
    id: 'architecture',
    title: 'Architecture',
    icon: Layout,
    content: `
# Architecture

## System Components

### Frontend Layer
- React-based single-page application
- Real-time updates via query invalidation
- Responsive design for all devices

### Application Layer
- Multi-tenant workspace isolation
- Role-based access control (RBAC)
- Background job processing
- Approval workflow engine

### Data Layer
- Entity-based data model
- Automatic audit logging
- Soft delete and retention policies

## Data Flow

\`\`\`
User → Frontend → API → Business Logic → Data Layer
                    ↓
              AI Engine (LLM)
                    ↓
              Response + Audit Log
\`\`\`

## Multi-Tenancy

All data is scoped by \`org_id\` (organization ID). This ensures complete isolation between workspaces:

- Queries are always filtered by org_id
- Members can only access their organization's data
- Audit logs are organization-scoped
- Integrations are configured per-organization

## Integration Points

1. **LLM Integration**: AI responses via Core.InvokeLLM
2. **Email Notifications**: Invites and alerts via Core.SendEmail
3. **File Storage**: Document uploads via Core.UploadFile
`
  },
  {
    id: 'data-model',
    title: 'Data Model',
    icon: Database,
    content: `
# Data Model

## Core Entities

### Organization
The root tenant entity. All other data is scoped to an organization.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Organization display name |
| slug | string | URL-friendly identifier |
| plan | enum | free, pro, team, enterprise |
| owner_email | string | Primary owner |

### Membership
Links users to organizations with roles.

| Field | Type | Description |
|-------|------|-------------|
| org_id | string | Organization reference |
| user_email | string | Member's email |
| role | enum | owner, admin, editor, viewer |
| status | enum | active, invited, suspended |

### Query
Stores all AI queries and responses.

| Field | Type | Description |
|-------|------|-------------|
| org_id | string | Tenant boundary |
| prompt | string | User's question |
| response | string | AI-generated answer |
| response_type | enum | answer, summary, action, analysis |
| status | enum | pending, processing, completed, failed |

### AuditLog
Immutable record of all system events.

| Field | Type | Description |
|-------|------|-------------|
| org_id | string | Tenant boundary |
| actor_email | string | Who performed the action |
| action | string | Action identifier |
| action_category | enum | auth, query, admin, data, integration, system |
| resource_type | string | Affected entity type |
| resource_id | string | Affected entity ID |

## Indexing Strategy

- Primary indexes on \`id\` for all entities
- Composite indexes on \`org_id + created_date\` for efficient queries
- Text indexes on \`Query.prompt\` for search functionality
`
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    content: `
# Security

## Authorization Model

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing, delete org |
| **Admin** | Manage members, settings, integrations |
| **Editor** | Create/edit queries, use copilot |
| **Viewer** | Read-only access to queries |

### Permission Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| Create Query | ✅ | ✅ | ✅ | ❌ |
| View Queries | ✅ | ✅ | ✅ | ✅ |
| Invite Members | ✅ | ✅ | ❌ | ❌ |
| Change Roles | ✅ | ✅ | ❌ | ❌ |
| Manage Integrations | ✅ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ |
| Approve Requests | ✅ | ✅ | ❌ | ❌ |

## Tenant Isolation

All data access is enforced at the query level:
- Every query includes \`org_id\` filter
- No cross-tenant data leakage possible
- Membership validated on every request

## Secrets Handling

- Secrets are never logged
- Integration credentials stored encrypted
- API keys rotated regularly
- No secrets in frontend code

## Audit Trail

All sensitive actions are logged:
- Authentication events
- Role changes
- Data exports
- Integration connections
- Approval decisions
`
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: Wrench,
    content: `
# Operations

## Runbooks

### High Error Rate

1. Check System Health page for service status
2. Review Recent Errors for patterns
3. Check job queue for stuck jobs
4. Verify integration connections

### Failed Jobs

1. Navigate to System Health → Job Queue
2. Identify failed jobs and error messages
3. For transient errors: jobs auto-retry up to 3 times
4. For persistent failures: check dead letter queue

### User Access Issues

1. Verify user membership status in Settings → Members
2. Check role assignments
3. Review audit log for recent changes
4. Resend invite if status is "invited"

## Monitoring

### Key Metrics

- **Query Latency**: Target < 500ms p95
- **Error Rate**: Target < 0.1%
- **Job Success Rate**: Target > 99%
- **API Uptime**: Target 99.9%

### Health Checks

The System Health page provides:
- Service status indicators
- Latency metrics
- Uptime percentages
- Job queue status
- Recent error logs

## Backup & Recovery

- All data automatically replicated
- Point-in-time recovery available
- Export functionality for data portability
- Retention policies configurable per plan

## Incident Response

1. **Detect**: Monitor alerts and health checks
2. **Triage**: Assess severity and impact
3. **Mitigate**: Apply immediate fixes
4. **Communicate**: Update stakeholders
5. **Resolve**: Implement permanent fix
6. **Review**: Post-incident analysis
`
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    content: `
# Frequently Asked Questions

## General

### What is the AI Copilot?
The AI Copilot is an intelligent assistant that helps teams get quick answers, summaries, and insights. It uses advanced language models to understand context and provide relevant responses.

### How do I invite team members?
Go to Settings → Members → Invite Member. Enter their email and select a role. They'll receive an invitation email.

### What plans are available?
- **Free**: 100 queries/month, 1 user
- **Pro**: 1,000 queries/month, 5 users
- **Team**: 10,000 queries/month, 25 users, SSO
- **Enterprise**: Unlimited, custom SLA

## Security

### Is my data secure?
Yes. All data is encrypted at rest and in transit. We use industry-standard security practices and undergo regular security audits.

### Who can see my queries?
Only members of your organization can see queries. Data is completely isolated between organizations.

### Can I export my data?
Yes. Admins can request data exports from the Settings page. Exports include all queries, audit logs, and member data.

## Technical

### What's the response time?
Most queries complete in under 500ms. Complex queries with internet context may take 1-2 seconds.

### Are there rate limits?
Yes, based on your plan:
- Free: 10 queries/minute
- Pro: 50 queries/minute
- Team: 200 queries/minute
- Enterprise: Custom

### Can I integrate with other tools?
Yes. We support integrations with Slack, Notion, Confluence, GitHub, Jira, Linear, and custom webhooks.
`
  }
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const currentSection = DOCS_SECTIONS.find(s => s.id === activeSection) || DOCS_SECTIONS[0];

  const filteredSections = searchQuery
    ? DOCS_SECTIONS.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DOCS_SECTIONS;

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Book className="h-5 w-5 text-slate-600" />
            <h1 className="font-semibold text-slate-900">Documentation</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="pl-9 h-9 bg-slate-50"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {filteredSections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    activeSection === section.id
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <SectionIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.title}</span>
                  {activeSection === section.id && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <article className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-600">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-600">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-slate-600">{children}</li>
                ),
                code: ({ inline, children }) => 
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono my-4">
                      <code>{children}</code>
                    </pre>
                  ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full border-collapse border border-slate-200 rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-slate-50 px-4 py-2 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 text-sm text-slate-600 border-b border-slate-100">
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-900">{children}</strong>
                ),
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {currentSection.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}