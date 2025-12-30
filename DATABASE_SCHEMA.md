# Database Schema Documentation

## Overview

Nexus Copilot uses Base44's NoSQL database system for data persistence. The database follows a document-oriented model with predefined entity schemas. All entities are stored with automatic timestamp tracking and organization-based multi-tenancy.

## Table of Contents

- [Entity Overview](#entity-overview)
- [Entity Schemas](#entity-schemas)
- [Relationships](#relationships)
- [Indexes & Performance](#indexes--performance)
- [Data Access Patterns](#data-access-patterns)
- [Migration Strategy](#migration-strategy)

## Entity Overview

The database consists of 8 core entities:

| Entity | Purpose | Key Relations |
|--------|---------|---------------|
| **Organization** | Tenant/company data | Parent of all entities |
| **Membership** | User-org associations | Links users to organizations |
| **Query** | AI query records | Owned by organization |
| **KnowledgeBase** | Document repository | Owned by organization |
| **Integration** | External service connections | Owned by organization |
| **Approval** | Query approval workflow | References Query |
| **AuditLog** | Activity tracking | References all entities |
| **BackgroundJob** | Async task management | Owned by organization |

### Entity Hierarchy

```
Organization
├── Membership (1:N)
├── Query (1:N)
│   └── Approval (1:1 or 1:0)
├── KnowledgeBase (1:N)
├── Integration (1:N)
├── BackgroundJob (1:N)
└── AuditLog (1:N)
```

## Entity Schemas

### 1. Organization

**Purpose**: Represents a company or team using the platform.

```javascript
{
  // Auto-generated fields
  id: string,                    // Unique identifier (Base44 generated)
  created_date: timestamp,       // ISO 8601 timestamp
  updated_date: timestamp,       // ISO 8601 timestamp
  
  // Required fields
  name: string,                  // Organization name
  owner_email: string,           // Primary owner's email
  
  // Optional fields
  plan: string,                  // Subscription plan: 'free' | 'pro' | 'enterprise'
  plan_limits: {
    max_queries_per_month: number,
    max_members: number,
    max_integrations: number,
    max_knowledge_base_items: number,
    features: string[]           // Available features
  },
  settings: {
    require_approval: boolean,   // Require approval for queries
    default_llm_model: string,   // Default AI model
    timezone: string,            // Organization timezone
    language: string,            // Preferred language
  },
  billing: {
    stripe_customer_id: string,
    subscription_id: string,
    current_period_end: timestamp,
    status: string               // 'active' | 'past_due' | 'canceled'
  },
  metadata: object,              // Additional custom data
}
```

**Indexes**:
- Primary: `id`
- Secondary: `owner_email`

**Access Patterns**:
- Lookup by ID
- Lookup by owner email
- List all organizations (admin only)

---

### 2. Membership

**Purpose**: Associates users with organizations and defines their roles.

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  updated_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  user_email: string,            // User's email (Base44 auth)
  role: string,                  // 'owner' | 'admin' | 'member' | 'viewer'
  status: string,                // 'active' | 'pending' | 'suspended' | 'removed'
  
  // Optional fields
  invited_by: string,            // Email of user who sent invitation
  invitation_token: string,      // Token for accepting invitation
  invitation_expires: timestamp,
  last_active: timestamp,
  permissions: string[],         // Custom permissions
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `user_email`
- Compound: `org_id + user_email` (unique)
- Filter: `status`

**Access Patterns**:
- Find memberships by organization
- Find memberships by user email
- Check user's role in organization
- List active members

**Roles & Permissions**:

| Role | Permissions |
|------|-------------|
| **owner** | Full access, billing, delete org |
| **admin** | Manage members, settings, integrations |
| **member** | Create queries, view org data |
| **viewer** | Read-only access |

---

### 3. Query

**Purpose**: Stores AI query submissions and responses.

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  updated_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  user_email: string,            // User who created the query
  prompt: string,                // User's input query
  status: string,                // 'processing' | 'completed' | 'failed' | 'pending_approval'
  
  // Response fields
  response: string,              // AI-generated response
  response_type: string,         // 'summary' | 'action' | 'analysis' | 'answer' | 'data'
  response_format: string,       // 'text' | 'markdown' | 'json' | 'table'
  
  // Performance metrics
  latency_ms: number,            // Query processing time
  tokens_used: number,           // LLM tokens consumed
  model_used: string,            // AI model identifier
  
  // Context & metadata
  context_used: [
    {
      type: string,              // 'integration' | 'knowledge_base' | 'history'
      source_id: string,         // ID of source
      relevance_score: number,   // 0.0 to 1.0
    }
  ],
  integrations_queried: string[], // Integration IDs used
  knowledge_base_refs: string[],  // Knowledge base IDs referenced
  
  // User interaction
  is_saved: boolean,             // User bookmarked
  feedback: string,              // 'positive' | 'negative' | null
  feedback_notes: string,        // User's feedback comments
  
  // Error handling
  error_message: string,         // Error details if failed
  retry_count: number,           // Number of retries
  
  // Metadata
  tags: string[],                // User-defined tags
  category: string,              // Query category
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `user_email`, `status`
- Sort: `-created_date` (descending)
- Filter: `is_saved`, `response_type`, `status`

**Access Patterns**:
- List queries by organization (paginated)
- List queries by user
- Filter by status, type, or saved
- Search by prompt text
- Sort by date (newest first)
- Aggregate metrics (count, avg latency)

**Query Lifecycle**:

```
Created (processing) → Processing → Completed
                     ↓
                  Failed (can retry)
                     ↓
           Pending Approval (if enabled)
                     ↓
              Approved/Rejected
```

---

### 4. KnowledgeBase

**Purpose**: Stores documents and information for context-aware AI responses.

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  updated_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  title: string,                 // Document title
  content: string,               // Document content (text)
  type: string,                  // 'document' | 'url' | 'api' | 'database' | 'file'
  is_active: boolean,            // Whether to use in queries
  
  // Source information
  source: {
    type: string,                // Origin type
    url: string,                 // Source URL if applicable
    file_name: string,           // Original filename
    file_size: number,           // Size in bytes
    mime_type: string,           // MIME type
  },
  
  // Processing metadata
  processed: boolean,            // Whether content is processed
  embedding_generated: boolean,  // Vector embedding created
  last_indexed: timestamp,       // Last indexing time
  
  // Content metadata
  content_hash: string,          // Hash for change detection
  word_count: number,
  language: string,
  
  // Organization
  tags: string[],
  category: string,
  author: string,                // User who added it
  
  // Access control
  visibility: string,            // 'org' | 'team' | 'private'
  allowed_users: string[],       // If private
  
  // Statistics
  usage_count: number,           // Times referenced in queries
  last_used: timestamp,
  
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `is_active`
- Filter: `type`, `category`, `visibility`
- Sort: `-created_date`, `title`

**Access Patterns**:
- List active knowledge base items
- Search by title or content
- Filter by category or type
- Find relevant items for query context
- Track usage statistics

**Content Types**:

| Type | Description | Source |
|------|-------------|--------|
| **document** | Manual text entry | User input |
| **url** | Web page content | Scraped |
| **api** | API endpoint data | Fetched |
| **database** | Database query results | Connected DB |
| **file** | Uploaded document | File upload |

---

### 5. Integration

**Purpose**: Manages connections to external services (Slack, GitHub, etc.).

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  updated_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  type: string,                  // 'slack' | 'github' | 'jira' | 'confluence' | 'custom'
  name: string,                  // User-friendly name
  status: string,                // 'active' | 'inactive' | 'error' | 'pending'
  
  // Configuration
  config: {
    // Type-specific configuration
    // e.g., for Slack:
    workspace_id: string,
    bot_token: string,           // Encrypted
    channels: string[],          // Monitored channels
    
    // e.g., for GitHub:
    owner: string,
    repo: string,
    access_token: string,        // Encrypted
    
    // Common fields
    webhook_url: string,
    api_endpoint: string,
    auth_method: string,         // 'oauth' | 'api_key' | 'basic'
  },
  
  // OAuth data
  oauth: {
    access_token: string,        // Encrypted
    refresh_token: string,       // Encrypted
    token_expires: timestamp,
    scope: string[],
  },
  
  // Sync information
  sync_enabled: boolean,
  sync_frequency: string,        // 'realtime' | 'hourly' | 'daily' | 'manual'
  last_sync: timestamp,
  next_sync: timestamp,
  sync_status: string,           // 'success' | 'failed' | 'in_progress'
  
  // Health monitoring
  last_error: string,
  error_count: number,
  uptime_percentage: number,
  
  // Usage stats
  queries_used_in: number,       // Times used in queries
  data_points_synced: number,
  
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `status`, `type`

**Access Patterns**:
- List integrations by organization
- Filter active integrations
- Find integrations by type
- Check integration health
- Trigger sync operations

**Supported Integrations**:

| Integration | Features | Data Accessed |
|-------------|----------|---------------|
| **Slack** | Messages, channels, users | Public channels, DMs (with permission) |
| **GitHub** | Issues, PRs, commits | Public & private repos |
| **Jira** | Issues, projects | Accessible projects |
| **Confluence** | Pages, spaces | Readable content |
| **Custom** | Webhook/API | Configurable |

---

### 6. Approval

**Purpose**: Workflow for reviewing and approving queries before processing.

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  updated_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  query_id: string,              // Foreign key to Query
  status: string,                // 'pending' | 'approved' | 'rejected'
  
  // Review information
  reviewer_email: string,        // User who reviewed
  reviewed_date: timestamp,
  notes: string,                 // Reviewer's comments
  
  // Request information
  requested_by: string,          // User who created query
  request_reason: string,        // Why approval needed
  priority: string,              // 'low' | 'normal' | 'high' | 'urgent'
  
  // Approval policy
  requires_count: number,        // Number of approvals needed
  approvers: string[],           // Designated approvers
  approvals_received: [
    {
      email: string,
      timestamp: timestamp,
      decision: string,          // 'approve' | 'reject'
    }
  ],
  
  // Expiration
  expires_at: timestamp,
  auto_reject_on_expire: boolean,
  
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `query_id`, `status`
- Filter: `reviewer_email`, `requested_by`

**Access Patterns**:
- List pending approvals
- Find approvals by query
- Find approvals by reviewer
- Track approval metrics

**Approval Workflow**:

```
Query Created (if approval required)
    ↓
Approval Created (status: pending)
    ↓
Assigned to Reviewers
    ↓
Reviewer(s) Review
    ↓
Approved → Query Processing
    ↓
Rejected → Query Blocked
    ↓
Expired → Auto-reject or Keep Pending
```

---

### 7. AuditLog

**Purpose**: Comprehensive activity logging for compliance and debugging.

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  user_email: string,            // User who performed action
  action: string,                // Action performed
  entity_type: string,           // Type of entity affected
  entity_id: string,             // ID of affected entity
  
  // Action details
  action_type: string,           // 'create' | 'read' | 'update' | 'delete'
  description: string,           // Human-readable description
  
  // Context
  details: {
    changes: object,             // Before/after values
    reason: string,              // Why action was taken
    metadata: object,            // Additional context
  },
  
  // Technical details
  ip_address: string,
  user_agent: string,
  request_id: string,            // For request tracing
  
  // Result
  success: boolean,
  error_message: string,
  
  // Compliance
  retention_until: timestamp,    // Data retention policy
  
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `user_email`, `entity_type`, `entity_id`
- Sort: `-created_date`
- Filter: `action`, `action_type`, `success`

**Access Patterns**:
- List audit logs for organization
- Filter by user, entity, or action
- Search by date range
- Compliance reporting
- Security investigation

**Tracked Actions**:

| Category | Actions |
|----------|---------|
| **Authentication** | login, logout, password_change |
| **Organization** | create, update, delete, settings_change |
| **Membership** | invite, accept, remove, role_change |
| **Query** | create, update, delete, save, feedback |
| **Knowledge** | create, update, delete, activate, deactivate |
| **Integration** | create, update, delete, sync, auth |
| **Approval** | submit, approve, reject |
| **Settings** | update, plan_change, billing_change |

---

### 8. BackgroundJob

**Purpose**: Manages asynchronous tasks and long-running operations.

```javascript
{
  // Auto-generated fields
  id: string,
  created_date: timestamp,
  updated_date: timestamp,
  
  // Required fields
  org_id: string,                // Foreign key to Organization
  type: string,                  // Job type
  status: string,                // 'queued' | 'running' | 'completed' | 'failed' | 'canceled'
  
  // Job details
  priority: number,              // 0-10, higher is more important
  scheduled_for: timestamp,      // When to run (null = ASAP)
  started_at: timestamp,
  completed_at: timestamp,
  
  // Progress tracking
  progress: number,              // 0-100 percentage
  progress_message: string,
  estimated_completion: timestamp,
  
  // Input/output
  input: object,                 // Job parameters
  result: object,                // Job result data
  
  // Error handling
  error: string,
  error_details: object,
  retry_count: number,
  max_retries: number,
  last_retry: timestamp,
  
  // Resource usage
  cpu_time_ms: number,
  memory_used_mb: number,
  
  // Cleanup
  auto_delete_after: timestamp,  // Auto-delete after completion
  
  metadata: object,
}
```

**Indexes**:
- Primary: `id`
- Secondary: `org_id`, `status`, `type`
- Sort: `priority`, `-created_date`

**Access Patterns**:
- List jobs by organization
- Find jobs by status
- Queue new jobs
- Monitor job progress
- Retry failed jobs

**Job Types**:

| Type | Purpose | Duration |
|------|---------|----------|
| **export** | Export queries/data | 1-5 min |
| **import** | Import knowledge base | 5-30 min |
| **sync** | Sync integration data | 1-10 min |
| **analysis** | Run analytics | 2-15 min |
| **cleanup** | Delete old data | 5-30 min |
| **report** | Generate report | 2-20 min |

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organization   │──┐
└─────────────────┘  │
         │           │
         │ 1:N       │
         ▼           │
┌─────────────────┐  │
│   Membership    │  │
└─────────────────┘  │
                     │
         ┌───────────┼───────────┬───────────┬───────────┐
         │           │           │           │           │
         ▼           ▼           ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│    Query     │ │Knowledge │ │Integration│ │AuditLog  │ │Background│
│              │ │   Base   │ │          │ │          │ │   Job    │
└──────┬───────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
       │
       │ 1:1
       ▼
┌──────────────┐
│   Approval   │
└──────────────┘
```

### Referential Integrity

**Foreign Key Constraints** (enforced at application level):

- All entities reference `Organization.id` via `org_id`
- `Membership.org_id` → `Organization.id`
- `Query.org_id` → `Organization.id`
- `Approval.query_id` → `Query.id`
- `Approval.org_id` → `Organization.id`

**Cascade Rules**:

- Delete Organization → Archive/Delete all related entities
- Delete Query → Archive/Delete related Approval
- Delete User → Archive Membership (keep for audit)

## Indexes & Performance

### Primary Indexes

All entities have automatic primary indexes on `id`.

### Secondary Indexes

Recommended secondary indexes for query performance:

```javascript
// Organization
{ owner_email: 1 }

// Membership
{ org_id: 1, status: 1 }
{ user_email: 1 }
{ org_id: 1, user_email: 1 }  // Unique compound

// Query
{ org_id: 1, created_date: -1 }
{ org_id: 1, status: 1 }
{ user_email: 1, created_date: -1 }
{ org_id: 1, is_saved: 1 }

// KnowledgeBase
{ org_id: 1, is_active: 1 }
{ org_id: 1, category: 1 }

// Integration
{ org_id: 1, status: 1 }
{ org_id: 1, type: 1 }

// Approval
{ org_id: 1, status: 1, created_date: -1 }
{ query_id: 1 }
{ reviewer_email: 1, status: 1 }

// AuditLog
{ org_id: 1, created_date: -1 }
{ user_email: 1, created_date: -1 }
{ entity_type: 1, entity_id: 1 }

// BackgroundJob
{ org_id: 1, status: 1, priority: -1 }
{ type: 1, status: 1 }
```

### Query Optimization Tips

1. **Always filter by org_id first** - enables partition pruning
2. **Use pagination** - limit results to 20-100 per page
3. **Add sort order** - `-created_date` for recent-first queries
4. **Denormalize when needed** - duplicate data for faster reads
5. **Cache frequently accessed data** - use React Query caching

## Data Access Patterns

### Common Patterns

#### 1. List Queries with Filters

```javascript
const queries = await base44.entities.Query.filter(
  { 
    org_id: orgId,
    status: 'completed',
    is_saved: true
  }, 
  '-created_date',  // Sort by newest first
  50  // Limit to 50 results
);
```

#### 2. Find Single Entity

```javascript
const org = await base44.entities.Organization.filter({ id: orgId });
const organization = org[0];
```

#### 3. Check User Membership

```javascript
const memberships = await base44.entities.Membership.filter({
  user_email: userEmail,
  org_id: orgId,
  status: 'active'
});
const isActive = memberships.length > 0;
```

#### 4. Create with Audit Log

```javascript
// Create entity
const query = await base44.entities.Query.create(queryData);

// Log action
await base44.entities.AuditLog.create({
  org_id: orgId,
  user_email: userEmail,
  action: 'query_created',
  entity_type: 'Query',
  entity_id: query.id,
  details: { prompt: queryData.prompt }
});
```

#### 5. Update with Optimistic UI

```javascript
// Optimistically update UI
queryClient.setQueryData(['queries', orgId], (old) => [...old, newQuery]);

// Persist to database
const query = await base44.entities.Query.create(newQuery);

// Sync on success
queryClient.invalidateQueries(['queries', orgId]);
```

## Migration Strategy

### Version Control

Track schema changes with migration scripts:

```javascript
// migrations/001_add_query_tags.js
export async function up(base44) {
  // Migration logic
  // Note: Base44 is schemaless, so this is more about
  // data transformation than schema changes
  const queries = await base44.entities.Query.filter({});
  
  for (const query of queries) {
    if (!query.tags) {
      await base44.entities.Query.update(query.id, {
        ...query,
        tags: []
      });
    }
  }
}

export async function down(base44) {
  // Rollback logic
}
```

### Schema Evolution

**Adding Fields**:
- New fields are added with default values
- Existing entities remain valid
- Client code handles missing fields gracefully

**Removing Fields**:
- Deprecate first (add `@deprecated` comment)
- Remove client code usage
- Remove from entity after grace period

**Renaming Fields**:
- Add new field
- Migrate data
- Update client code
- Remove old field

### Data Retention

**Policies by Entity**:

| Entity | Retention | Archival Strategy |
|--------|-----------|-------------------|
| Organization | Indefinite | Soft delete, anonymize after 90 days |
| Membership | Indefinite | Archive on removal |
| Query | 1 year | Archive to cold storage |
| KnowledgeBase | Until deleted | Soft delete, archive after 30 days |
| Integration | Until deleted | Remove on disconnect |
| Approval | 2 years | Archive with related query |
| AuditLog | 7 years | Compliance requirement |
| BackgroundJob | 30 days | Auto-delete after completion |

---

**Document Version**: 1.0  
**Last Updated**: December 30, 2024  
**Next Review**: March 30, 2025
