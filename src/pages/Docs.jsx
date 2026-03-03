import React, { useState } from 'react';
import { Book, Sparkles, Workflow, Shield, Zap, FileText, ChevronRight, Bot, Brain } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';

const DOCUMENTATION = {
  usecases: `# Use Cases

This platform serves three distinct user rings — each with different goals, workflows, and value drivers. Understanding which ring you operate in helps you get the most out of every feature.

---

## 🔵 Inner Loop — Builders & Configurators

> **Who**: Developers, AI engineers, ops leads, and power users who build, configure, and maintain the platform for others.

The **inner loop** is the build-and-iterate cycle. Inner loop users spend time constructing agents, designing workflows, curating knowledge, and tuning the system's behavior. Their work multiplies the productivity of everyone else.

### Use Cases

#### 1. Build a Proactive Data Anomaly Agent
A data engineer notices that latency spikes in the query pipeline go undetected for hours. They:
1. Create an Agent with a "Data Analysis" persona and \`entity_crud\` + \`api_calls\` tools
2. Add a **Proactive Trigger** of type \`data_anomaly\` watching \`Query.latency_ms\` with a 2σ threshold
3. Set the task template: *"Latency anomaly detected. Analyze recent queries, identify root cause, and post a Slack summary."*
4. Set cooldown to 30 minutes, enable email notifications

**Result**: The agent autonomously wakes up when latency degrades and surfaces a root-cause report before any human notices.

---

#### 2. Build a Knowledge-Enriched Onboarding Workflow
An ops lead wants new hires to get instant answers about internal processes. They:
1. Upload SOPs, handbook PDFs, and runbook URLs to the **Knowledge Base**
2. Link related articles (e.g., "Expense Policy" → "Reimbursement Form" → "Finance Contact")
3. Create a **Workflow**: Trigger on new member invite → Copilot query "Summarize onboarding checklist for {name}" → Send welcome email with AI-generated summary

**Result**: Every new member gets a personalized, context-aware onboarding email within minutes of joining.

---

#### 3. Configure Role-Based Access for a New Team
A platform admin onboards a client-services team with read-only access:
1. Invite members via **Settings → Members** with role \`Viewer\`
2. Ensure sensitive workflow management is wrapped with \`PermissionGuard permission="manage_workflows"\`
3. Set Agent approval requirements on any actions touching production data

**Result**: The team can use Copilot and view analytics without risk of accidentally modifying workflows or integrations.

---

#### 4. Tune Agent Learning from Feedback
An AI engineer reviews the Agent Learning dashboard and notices an \`avoid\` pattern forming around a tool the agent keeps misusing:
1. Opens **Agent Builder → [Agent] → Learning tab**
2. Reviews collected correction patterns and their confidence scores
3. Adds a specific custom instruction to the agent persona: *"Never call the webhook tool before validating the payload schema"*
4. Sets \`confidence_threshold\` to 80 to make the agent more conservative

**Result**: The agent's behavior tightens over time with no retraining — just structured human feedback.

---

## 🟡 Outer Loop — Operators & Admins

> **Who**: Team leads, department managers, IT administrators, and operations managers who oversee the platform day-to-day and drive adoption across their org.

The **outer loop** is the orchestration cycle — scheduling, monitoring, approving, and governing. Outer loop users don't build the infrastructure but they run it, ensuring agents and workflows operate within organizational bounds.

### Use Cases

#### 1. Morning Operations Briefing (Automated)
An ops manager sets up a daily briefing that runs without any manual effort:
1. **Workflow Trigger**: Schedule — 8:00 AM, Mon–Fri
2. **Step 1**: Copilot query → *"Summarize yesterday's workflow executions, failed steps, and agent trigger activity"*
3. **Step 2**: Send email digest to ops-team@company.com
4. **Step 3**: Post condensed version to #ops-alerts Slack channel

**Result**: The entire ops team starts the day aligned on system health with zero manual reporting.

---

#### 2. Approval Governance for Sensitive Agent Actions
A compliance manager needs to ensure agents don't take irreversible actions autonomously:
1. Opens **Agent Builder → [Agent] → Approvals tab**
2. Enables **Require Human Approval** on data deletion and external API call steps
3. Reviews the **Approvals** page each morning — approves or rejects with documented reasoning
4. Monitors the **Audit Log** for all approval decisions and agent actions

**Result**: Full auditability with a clear paper trail for regulatory compliance.

---

#### 3. Integration Health Dashboard Review
An IT admin does a weekly integration health review:
1. Navigates to **Integration Health** page
2. Identifies integrations with health scores below 70
3. Triggers a bulk re-sync for degraded connections
4. Reviews error logs for any webhook failures
5. Sets up a **Metric Threshold Trigger** on sync failure count to auto-alert the team

**Result**: Integration reliability stays high without manual polling — issues surface before they impact users.

---

#### 4. Analytics-Driven Knowledge Gap Analysis
A team lead wants to know what users are asking that the knowledge base doesn't answer well:
1. Opens **Analytics** and reviews top Copilot queries with low satisfaction ratings
2. Cross-references with Knowledge Base usage counts (low \`usage_count\` = underutilized or missing content)
3. Creates new knowledge articles for the top 5 unanswered topics
4. Assigns article maintenance to subject matter experts

**Result**: The knowledge base continuously improves based on real usage signals rather than guesswork.

---

## 🟢 End User Loop — Everyday Users

> **Who**: Employees, frontline workers, analysts, customer support reps, and anyone who uses the platform to get work done — without needing to configure anything.

The **end user loop** is the consumption cycle. End users interact primarily through Copilot, receiving answers, surfacing knowledge, and triggering pre-built workflows. They benefit from what inner and outer loop users have built.

### Use Cases

#### 1. Instant Answer to a Complex Policy Question
A new sales rep needs to know the discount approval process before a call:
- Opens **Copilot**, types: *"What's the process to get a discount over 20% approved?"*
- Copilot searches the knowledge base, finds the pricing policy article and the approval workflow doc
- Returns a step-by-step answer citing both sources in under 3 seconds

**Result**: The rep gets the right answer immediately — no Slack threads, no waiting for a manager.

---

#### 2. Self-Service Data Lookup
An analyst needs last quarter's KPIs without opening a BI tool:
- Types: *"What was our average query response latency in Q4 and how does it compare to Q3?"*
- Copilot accesses integration context from connected analytics services
- Returns a comparison with trend commentary and flags an anomaly worth investigating

**Result**: Instant data-driven insight without switching tools or writing queries.

---

#### 3. Save and Share a Key Research Summary
A team member researches competitive positioning via Copilot:
1. Asks Copilot to summarize three competitors' recent product updates (with internet search enabled)
2. **Saves** the query for future reference
3. Shares the URL with the team via Slack

**Result**: Research is captured and shareable in one workflow — no separate document needed.

---

#### 4. Trigger an Agent Task on Demand
A customer support lead notices an unusual pattern in ticket volume:
- Opens **Agent Builder**, selects the "Support Analyst Agent"
- Clicks **Test Agent**, enters: *"Analyze support ticket themes from this week and identify the top 3 recurring issues"*
- Agent executes autonomously, queries the ticketing integration, and returns a structured report

**Result**: A non-technical user delegates a multi-step data task to an AI agent in 30 seconds.

---

#### 5. Proactive Notification from an Autonomous Agent
A product manager didn't ask for anything — but receives an email at 9:05 AM:

> *"Your 'Sprint Tracker' agent detected that open issue count exceeded 50 (threshold: 40). Here's a summary of the 12 new issues opened since yesterday, grouped by severity. Recommended: prioritize 3 critical bugs before the sprint review."*

**Result**: The user gets relevant, actionable insight before they even opened their laptop — driven entirely by a proactive trigger configured once by the inner loop team.

---

## Summary Matrix

| Dimension | Inner Loop | Outer Loop | End User Loop |
|---|---|---|---|
| **Primary action** | Build & configure | Govern & monitor | Query & consume |
| **Key features** | Agent Builder, Workflow Canvas, Knowledge Editor | Approvals, Audit Log, Analytics, Integrations | Copilot, Saved Queries, Agent Test |
| **Time horizon** | Days to weeks | Daily / weekly | Real-time / on-demand |
| **Value driver** | Capability creation | Reliability & compliance | Productivity & insight |
| **Proactive AI role** | Define triggers & learning | Approve & review | Receive autonomous outputs |
| **Technical level** | High | Medium | Low |`,

  overview: `# AI Copilot Platform Documentation

Welcome to the AI Copilot Platform — an intelligent workspace for AI agents, workflow automation, and organizational knowledge management.

## What's Inside

### 🤖 AI Copilot
Conversational AI with session memory, integration context, and user-specific preferences. Supports saving, sharing, and rating queries.

### 🦾 Autonomous Agents
Build and deploy agents that can act independently using tools, integrations, and learned behavior patterns. Agents support proactive triggers, human-in-the-loop approvals, and continuous learning from feedback.

### 🔄 Workflow Automation
Visual, canvas-based workflow builder with AI suggestions, conditional logic, retries, and integration actions.

### 📚 Knowledge Base
Hierarchical article storage with graph linking, version history, AI enhancements, and semantic search.

### 🔐 Role-Based Access Control
Granular permissions across Owner, Admin, Editor, and Viewer roles.

### 📊 Analytics & Monitoring
Real-time dashboards, audit logs, integration health tracking, and predictive insights.

## Quick Start

1. Complete **Onboarding** to set up your organization
2. Connect integrations via **Settings → Integrations**
3. Add knowledge to the **Knowledge Base**
4. Ask questions in **Copilot**
5. Create an **Agent** for recurring autonomous tasks
6. Automate repetitive flows in **Workflow Builder**`,

  copilot: `# Copilot

The Copilot is your primary AI interface. It pulls context from integrations, the knowledge base, and your conversation history to give relevant, accurate responses.

## Core Features

### Session Memory
Queries are grouped into sessions. The last 3 queries are included as context in each new request, enabling natural back-and-forth conversation.

### Knowledge Integration
For each query, Copilot automatically references:
- Up to 3 relevant knowledge base articles (with linked articles for additional context)
- All active integrations and their capabilities
- Prior conversation history in the current session

### User Preferences
Configure response behavior under **Copilot Settings**:
- **Response Length**: Concise, Balanced, Detailed
- **Verbosity**: Minimal, Normal, Verbose
- **Tone**: Professional, Friendly, Technical, Casual
- **Show Sources**: Show/hide integration and knowledge citations
- **Internet Search**: Enable for queries about current events

### Query Management
- **Save**: Bookmark important queries for later reference
- **Copy**: Copy raw response to clipboard
- **Feedback**: 1–5 star rating + comment to improve quality
- **History Sidebar**: Browse all past queries with search and filter

## Tips

- Be specific: "Summarize last week's GitHub PRs in the data team" beats "what happened recently"
- Use Copilot to explore knowledge: "What do we know about onboarding?"
- Chain questions — Copilot remembers your session context
- Enable Internet Search only when needed (adds latency)

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| \`⌘ /\` | Open Copilot from anywhere |
| \`⌘ \\\` | Toggle query history sidebar |
| \`⌘ S\` | Save current query |
| \`⌘ K\` | Open global command palette |`,

  agents: `# AI Agents

Agents are autonomous AI workers configured with personas, tools, and proactive triggers. They can execute multi-step tasks, learn from feedback, and act without direct user prompting.

## Agent Configuration

### Persona
Define the agent's identity:
- **Role**: e.g., "Data Analyst", "Customer Support Specialist"
- **Tone**: Professional, Friendly, Concise, Detailed
- **Expertise Areas**: Tags describing the agent's domain
- **Custom Instructions**: Freeform behavioral guidance

### Tools
Agents can be granted access to:
- **Entity CRUD**: Read/write app data
- **Integrations**: Slack, GitHub, email, etc.
- **Web Search**: Automatic for all agents

Each tool can be configured to require human approval before executing.

### Proactive Triggers
Agents can autonomously activate based on conditions — no user prompt needed.

#### Trigger Types

| Type | Description |
|---|---|
| \`data_anomaly\` | Detects values > 2 std deviations from mean |
| \`entity_pattern\` | Watches for entity count or condition matches |
| \`metric_threshold\` | Fires when a field crosses a numeric threshold |
| \`schedule\` | Runs on a cron schedule via automation |
| \`calendar_event\` | Reacts to upcoming calendar events |
| \`message_received\` | Responds to new messages from connected services |

#### Cooldown
Each trigger has a **cooldown period** (default: 60 minutes) to prevent redundant firing.

#### Task Template Variables
Use these placeholders in your task template:
- \`{trigger_type}\` — the type of trigger that fired
- \`{timestamp}\` — ISO timestamp of the event
- \`{context}\` — serialized trigger context object

### Learning & Feedback

After each execution, users can provide:
- A 1–5 star rating
- Step-by-step corrections (what should have happened instead)
- Free-form comments

Feedback is processed into **prefer** and **avoid** patterns stored in \`AgentLearning\`. These patterns are injected into the agent's planning prompt on future runs to continuously improve behavior.

**Pattern confidence** increases each time a pattern is reinforced by additional feedback.

### Human-in-the-Loop Approvals

Enable **Require Human Approval** on any agent to pause execution before sensitive steps. Approvals appear in the **Approvals** page for authorized reviewers.

## Execution Lifecycle

\`\`\`
User Task → LLM Planning → Step Execution (loop)
              ↓                    ↓
         Learning Context    Approval Gate (if enabled)
                                   ↓
                            Replan on Failure
                                   ↓
                             Result + Feedback
\`\`\`

## Testing Agents

Use **Test Agent** from the Agent Builder card. Provide a task prompt and watch the execution plan run in real time via the Execution Monitor.`,

  workflows: `# Workflow Automation

Build automated workflows that respond to events, run on schedules, or react to integration data — without code.

## Trigger Types

| Trigger | When it fires |
|---|---|
| **Manual** | On-demand via Run button |
| **Schedule** | Interval, daily, weekly, monthly, or cron |
| **Entity Event** | When a record is created, updated, or deleted |
| **Integration Event** | Events from connected services (e.g., new Slack message) |
| **Webhook** | Incoming HTTP POST to a generated URL |
| **Copilot Query** | After an AI response is generated |

## Step Types

### Action Steps
- **Send Notification** — Post to Slack, email, or webhooks
- **Send Email** — Template-based email to team or external contacts
- **Webhook** — Call any external API with custom headers and body
- **Integration Action** — Service-specific actions (e.g., create GitHub issue)

### Logic Steps
- **Condition** — If/else branching based on field values or expressions
- **Loop** — Iterate over arrays of data
- **Parallel** — Run multiple branches simultaneously

### Utility Steps
- **Delay** — Wait a fixed duration before the next step
- **Transform** — Map, filter, or reshape data between steps
- **AI Step** — Invoke Copilot to generate content mid-workflow

## Error Handling

Each step supports:
- **Retry**: Retry up to N times with configurable delay
- **Continue on Error**: Skip failed step and proceed
- **Fallback Step**: Route to an alternative step on failure

## AI Workflow Suggestions

The builder analyzes your integrations, recent queries, and existing workflows to suggest:
- Relevant workflow templates
- Next logical steps for your current workflow
- Optimization opportunities

## Example: Daily Team Briefing

\`\`\`
Trigger: Schedule — 8:30 AM, Mon–Fri
Step 1: Copilot Query → "Summarize open GitHub PRs and Jira tickets"
Step 2: Transform → Format as markdown digest
Step 3: Send Email → team@company.com
Step 4: Webhook → Post summary to Slack #general
\`\`\`

## Sub-Workflows

Steps can invoke other existing workflows, enabling modular, composable automation.`,

  knowledge: `# Knowledge Base

A structured, AI-enhanced repository for organizational knowledge. Articles are versioned, linked, and surfaced automatically in Copilot responses.

## Adding Knowledge

### Manual Entry
Write content directly in the editor with rich markdown support.

### File Upload
Upload PDFs, Word documents, or text files — content is extracted automatically.

### URL Import
Paste a URL and the system fetches and extracts the page content.

### Integration Sync
Pull content from connected Notion, Confluence, or GitHub wikis.

## Article Features

### Version History
Every edit creates a new version. Revert to any previous version at any time via the **Version History** tab in the article editor.

### Linking
Articles can link to related articles, creating a navigable knowledge graph. The **Graph View** visualizes relationships across the entire knowledge base.

### Backlinks
When Article A links to Article B, Article B automatically tracks Article B as a backlink — making it easy to discover related content.

### AI Enhancements
The **AI tab** in article editor can:
- Suggest related articles
- Generate tags automatically
- Improve readability and clarity
- Summarize long content

### Active / Inactive
Toggle an article's active status to include or exclude it from Copilot context without deleting it.

## Semantic Search

Use **Knowledge Assistant** to ask questions across the entire knowledge base. The AI finds relevant articles and synthesizes an answer.

## Best Practices

- Write clear, specific titles (used for matching)
- Use consistent categories and tags
- Link related articles to build context
- Keep articles focused — one topic per article
- Archive outdated articles rather than deleting`,

  integrations: `# Integrations

Connect external services to give Copilot and Agents real-time context and action capabilities.

## Supported Services

| Service | Use Case |
|---|---|
| **Slack** | Team messaging, notifications, event triggers |
| **Notion** | Knowledge sync, page reading/writing |
| **GitHub** | PR tracking, issue management, code context |
| **Jira** | Ticket management, sprint tracking |
| **Linear** | Issue tracking, project updates |
| **Confluence** | Documentation sync |
| **Custom Webhook** | Any external service via HTTP |

## Setup Wizard

1. **Select Service** — Choose from the integration library
2. **Connect Account** — Authenticate via OAuth or API key
3. **Configure Features** — Select capabilities to enable
4. **Review & Save** — Confirm configuration

## Configuration Options

- **Webhook URL**: Auto-generated endpoint for inbound events
- **Sync Interval**: 15 minutes to daily
- **Event Triggers**: Specific events to monitor (e.g., PR opened, message received)
- **Capabilities**: Granular permission selection per service

## Health Monitoring

Each integration has a **Health Score (0–100)** computed from:
- Error rate over the past 24 hours
- Sync failure count
- Time since last successful sync
- Connection staleness

### Alert Levels
- 🔴 **Critical** (score < 40): Immediate notification, likely disconnected
- 🟡 **Warning** (score 40–70): Degrading performance
- 🟢 **Healthy** (score > 70): Operating normally

## Bulk Operations

From **Settings → Integrations**:
- Re-authenticate multiple integrations at once
- Trigger bulk sync
- Mass enable/disable capabilities`,

  rbac: `# Role-Based Access Control

Fine-grained permissions protect sensitive features and data across the organization.

## Roles

| Role | Description |
|---|---|
| **Owner** | Full access to everything, including org deletion |
| **Admin** | Manage members, integrations, approvals, settings |
| **Editor** | Create/edit knowledge and workflows, use Copilot |
| **Viewer** | Use Copilot and view analytics (read-only) |

## Permission Matrix

| Permission | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| manage_members | ✅ | ✅ | ❌ | ❌ |
| manage_integrations | ✅ | ✅ | ❌ | ❌ |
| approve_requests | ✅ | ✅ | ❌ | ❌ |
| view_audit_logs | ✅ | ✅ | ❌ | ❌ |
| manage_knowledge | ✅ | ✅ | ✅ | ❌ |
| manage_workflows | ✅ | ✅ | ✅ | ❌ |
| use_copilot | ✅ | ✅ | ✅ | ✅ |
| view_analytics | ✅ | ✅ | ✅ | ✅ |

## Using PermissionGuard

Wrap any UI element to conditionally render based on the current user's role:

\`\`\`jsx
import PermissionGuard from '@/components/rbac/PermissionGuard';

// Single permission
<PermissionGuard permission="manage_integrations" fallback={<NoAccess />}>
  <IntegrationSettings />
</PermissionGuard>

// Require any of multiple permissions
<PermissionGuard permission={['manage_integrations', 'admin']} requireAny>
  <AdminPanel />
</PermissionGuard>
\`\`\`

## usePermissions Hook

\`\`\`jsx
import { usePermissions } from '@/components/rbac/PermissionGuard';

function MyComponent() {
  const { role, loading, can } = usePermissions();

  if (loading) return null;

  return can('manage_members') ? <MemberManagement /> : <ReadOnlyView />;
}
\`\`\`

## Approvals Workflow

When sensitive actions require oversight:
1. User requests the action (e.g., role change, data export)
2. An **Approval** record is created with status \`pending\`
3. Admin sees it in **Approvals** page
4. Admin approves or rejects with a reason
5. Approval records expire after a configurable window

## Audit Log

All significant actions are recorded in the **AuditLog** entity:
- Actor email, action, resource type/ID
- Timestamp, IP address, status
- Correlation ID for tracing related events

Browse audit logs under **Activity Log** or **Settings → Audit Log**.`,

  api: `# Data Models & SDK Reference

## Core Entities

### Query
\`\`\`
prompt, response, response_type (answer|summary|action|analysis)
status (pending|processing|completed|failed)
tokens_used, latency_ms
integration_refs[], context_refs[]
is_saved, is_shared, tags[]
\`\`\`

### Agent
\`\`\`
name, org_id, is_active
persona { role, tone, expertise_areas, custom_instructions }
capabilities[], allowed_tools[]
learning_config { enable_feedback_learning, confidence_threshold, max_chain_length }
performance_metrics { total_executions, success_rate, avg_execution_time_ms }
\`\`\`

### AgentExecution
\`\`\`
agent_id, task, status (planning|executing|completed|failed)
plan[] { step_number, description, action, status }
result, execution_time_ms, error_message
user_feedback { rating, comment, helpful }
\`\`\`

### AgentMonitor (Proactive Triggers)
\`\`\`
agent_id, org_id, name, is_active
trigger_type (data_anomaly|entity_pattern|metric_threshold|schedule|calendar_event|message_received)
trigger_config { entity_name, field_name, condition, threshold, time_window }
agent_task_template, cooldown_minutes
last_triggered_at, trigger_count
notification_config { notify_on_trigger, notification_channels[] }
\`\`\`

### AgentLearning
\`\`\`
agent_id, org_id
pattern_type (prefer|avoid)
task_context, original_action, corrected_action
reasoning, confidence_score, feedback_count
applicable_conditions[], source_feedback_ids[]
\`\`\`

### Workflow
\`\`\`
name, description, org_id, is_active
trigger_type, trigger_config
steps[] { id, type, config, error_config, next_step_id, position }
execution_count, last_executed
\`\`\`

### KnowledgeBase
\`\`\`
org_id, title, content
source_type (upload|url|manual|integration)
category, tags[], is_active
linked_articles[], backlinks[], parent_article_id
usage_count, last_used_at
\`\`\`

### AgentFeedback
\`\`\`
agent_id, execution_id, user_email
feedback_type (validation|correction|rating)
rating (1-5), was_helpful
corrections[] { step_number, original_action, corrected_action, reason }
comment, applied_to_learning
\`\`\`

## SDK Quick Reference

\`\`\`javascript
import { base44 } from '@/api/base44Client';

// List with sort and limit
await base44.entities.Query.list('-created_date', 20);

// Filter
await base44.entities.Query.filter({ org_id, status: 'completed' }, '-created_date', 50);

// Create
await base44.entities.Agent.create({ org_id, name: 'My Agent', ... });

// Update
await base44.entities.Agent.update(id, { is_active: false });

// Delete
await base44.entities.AgentMonitor.delete(id);

// Real-time subscription
const unsub = base44.entities.AgentExecution.subscribe((event) => {
  if (event.type === 'update') setExecution(event.data);
});
// Cleanup:
unsub();
\`\`\`

## Invoking Backend Functions

\`\`\`javascript
// From frontend
const { data } = await base44.functions.invoke('agentExecuteWithTools', {
  agent_id,
  task: 'Analyze sales trends for Q1',
  org_id,
});

// From another backend function
const res = await base44.functions.invoke('agentProactiveMonitor', { org_id });
\`\`\`

## LLM Integration

\`\`\`javascript
const response = await base44.integrations.Core.InvokeLLM({
  prompt: 'Summarize the following: ...',
  add_context_from_internet: false,
  response_json_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      key_points: { type: 'array', items: { type: 'string' } }
    }
  }
});
\`\`\``,
};

const SECTIONS = [
  { id: 'usecases', label: 'Use Cases', icon: Sparkles },
  { id: 'overview', label: 'Overview', icon: Book },
  { id: 'copilot', label: 'Copilot', icon: Sparkles },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'knowledge', label: 'Knowledge Base', icon: Brain },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'rbac', label: 'Access Control', icon: Shield },
  { id: 'api', label: 'Data Models & SDK', icon: FileText },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const activeContent = DOCUMENTATION[activeSection];
  const activeMeta = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen p-6 sticky top-0">
        <div className="flex items-center gap-2 mb-8">
          <Book className="h-5 w-5 text-slate-900" />
          <h1 className="text-lg font-semibold text-slate-900">Documentation</h1>
        </div>

        <nav className="space-y-0.5 flex-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {section.label}
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-1">Have a question?</p>
          <p className="text-xs text-blue-700">Ask Copilot — it has full context of this platform.</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 pt-12 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 lg:py-12">
          <div className="mb-6 flex items-center gap-3">
            {activeMeta && <activeMeta.icon className="h-5 w-5 text-slate-400" />}
            <Badge variant="secondary" className="text-xs">{activeMeta?.label}</Badge>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6 sm:p-10">
              <ReactMarkdown
                className="prose prose-slate max-w-none"
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-slate-900 mt-10 mb-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-slate-800 mt-6 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-slate-600 leading-relaxed mb-4">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-600">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 mb-4 text-slate-600">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-50">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-slate-600 border-b border-slate-100">{children}</td>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-800">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-900 text-slate-100 rounded-lg p-5 overflow-x-auto mb-4 text-sm leading-relaxed">
                        <code>{children}</code>
                      </pre>
                    ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-slate-300 pl-4 my-4 text-slate-500 italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-8 border-slate-200" />,
                }}
              >
                {activeContent}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}