import React, { useState } from 'react';
import { Book, Sparkles, Workflow, Shield, Zap, Settings as SettingsIcon, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';

const DOCUMENTATION = {
  overview: `# AI Copilot Platform Documentation

Welcome to the AI Copilot Platform - an intelligent workspace automation and knowledge management system.

## Key Features

### 🤖 AI Copilot
Conversational AI assistant with memory, context awareness, and customizable preferences.

### 🔄 Workflow Automation
Visual workflow builder with AI-powered suggestions, conditional logic, and integration actions.

### 🔐 Role-Based Access Control
Granular permissions system with roles: Owner, Admin, Editor, and Viewer.

### 🔌 Integration Management
Connect external services with guided setup wizards and health monitoring.

### 📊 Analytics & Monitoring
Real-time system health, audit logs, and integration status tracking.`,

  copilot: `# Copilot Documentation

## Features

### Conversational Memory
Copilot remembers previous interactions within a session, providing contextual responses.

### User Preferences
Customize your Copilot experience:
- **Response Length**: Concise, Balanced, or Detailed
- **Verbosity**: Minimal, Normal, or Verbose
- **Show Sources**: Toggle integration/knowledge base citations

### Feedback System
Rate responses from 1-5 stars with detailed feedback:
- Helpful / Not helpful quick buttons
- Detailed feedback with categories (accurate, incomplete, too verbose, etc.)
- Comments for improvement

### Knowledge Integration
Copilot accesses:
- Connected integrations (Slack, Notion, GitHub, etc.)
- Organization knowledge base
- Conversation history

## Usage

1. Navigate to **Copilot** page
2. Type your question in the input field
3. View AI-generated responses with sources
4. Rate responses to improve quality
5. Save important queries for later

## Tips

- Use specific questions for better results
- Reference previous conversation context
- Save frequently used queries
- Provide feedback to improve responses`,

  workflows: `# Workflow Automation Documentation

## Overview

Create automated workflows that respond to events, schedules, or manual triggers.

## Workflow Components

### Triggers
- **Manual**: Run on demand
- **Schedule**: Time-based (interval, cron, daily, weekly)
- **Integration Event**: When something happens in connected services
- **Copilot Query**: After AI response generation

### Step Types

#### Action Steps
- **Send Notification**: Post to team channels
- **Send Email**: Email team members or external contacts
- **Webhook**: Call external APIs
- **Integration Action**: Service-specific actions

#### Logic Steps
- **Condition**: If/else branching based on data
- **Transform**: Manipulate and transform data

#### Utility Steps
- **Delay**: Wait before executing next step

## AI Suggestions

The workflow builder analyzes:
- Connected integrations
- Recent Copilot queries
- Existing workflows
- Common patterns

Based on this analysis, it suggests:
- Relevant workflow templates
- Next steps for current workflow
- Optimization opportunities

## Creating a Workflow

1. Navigate to **Workflow Builder**
2. Click **New Workflow**
3. Configure trigger type
4. Add steps using the canvas
5. Configure each step's parameters
6. Save and activate

## Example Workflows

### Daily Summary Report
- **Trigger**: Schedule (daily at 9 AM)
- **Steps**: 
  1. Query Copilot for daily summary
  2. Send email to team
  3. Post to Slack channel

### Integration Event Response
- **Trigger**: Integration Event (GitHub new issue)
- **Steps**:
  1. Transform issue data
  2. Create Copilot query for analysis
  3. Post response to issue comments`,

  integrations: `# Integration Management Documentation

## Supported Integrations

- **Slack**: Team communication
- **Notion**: Knowledge base
- **GitHub**: Code repository
- **Jira**: Project tracking
- **Linear**: Issue tracking
- **Confluence**: Documentation

## Setup Process

### Guided Wizard (4 Steps)

1. **Select Service**: Choose integration type
2. **Connect Account**: Authenticate via OAuth
3. **Configure Features**: Select capabilities to enable
4. **Review**: Confirm settings

### Configuration Options

- **Webhook URL**: Receive real-time events
- **Sync Interval**: Custom sync frequency (15 min - daily)
- **Event Triggers**: Specific events to monitor
- **Capabilities**: Granular permission selection

## Health Monitoring

The system tracks:
- Error rates
- Sync failures
- Connection staleness
- Health score (0-100)

### Alerts
- **Critical**: Immediate notification for connection failures
- **Warning**: Proactive alerts for degrading performance

## Bulk Operations

- Re-authenticate multiple integrations
- Bulk sync across services
- Mass configuration updates`,

  rbac: `# Role-Based Access Control Documentation

## Roles & Permissions

### Owner
- Full system access
- All permissions (wildcard)
- Manage organization settings
- Delete organization

### Admin
- Manage members
- Manage integrations
- Approve requests
- View audit logs
- Manage knowledge base
- Use Copilot
- View analytics
- Manage settings

### Editor
- Manage knowledge base
- Use Copilot
- View analytics

### Viewer
- Use Copilot
- View analytics (read-only)

## Permission System

### Using PermissionGuard Component

\`\`\`jsx
import PermissionGuard from '@/components/rbac/PermissionGuard';

<PermissionGuard permission="manage_integrations" fallback={<NoAccess />}>
  <IntegrationSettings />
</PermissionGuard>
\`\`\`

### Multiple Permissions

\`\`\`jsx
<PermissionGuard 
  permission={['manage_integrations', 'admin']} 
  requireAny={true}
>
  <Content />
</PermissionGuard>
\`\`\`

### Using Hooks

\`\`\`jsx
import { usePermissions } from '@/components/rbac/PermissionGuard';

function MyComponent() {
  const { role, loading, can } = usePermissions();
  
  if (can('manage_members')) {
    return <MemberManagement />;
  }
}
\`\`\`

## Best Practices

- Always wrap sensitive features with PermissionGuard
- Use appropriate fallback UI for unauthorized access
- Audit role changes in AuditLog
- Review permissions regularly`,

  api: `# API & Data Models

## Core Entities

### Query
User queries and Copilot responses with context tracking.

**Fields:**
- prompt, response, response_type
- status, tokens_used, latency_ms
- integration_refs, context_refs
- is_saved, is_shared, tags

### Workflow
Automated workflow definitions.

**Fields:**
- name, description, trigger_type
- trigger_config, steps, is_active
- execution_count, last_executed

### Integration
External service connections.

**Fields:**
- type, name, status, capabilities
- config, last_sync_at, sync_count
- error_message

### UserPreferences
Per-user Copilot settings.

**Fields:**
- copilot_response_length
- copilot_verbosity
- copilot_show_sources
- notification_preferences

### ConversationSession
Copilot conversation grouping.

**Fields:**
- title, query_ids, context_summary
- is_active, last_activity

### QueryFeedback
User feedback on AI responses.

**Fields:**
- query_id, rating (1-5)
- feedback_type, comment, sentiment

## Base44 SDK Usage

### Queries
\`\`\`javascript
// Create query
await base44.entities.Query.create({
  org_id: orgId,
  prompt: "Question",
  status: "processing"
});

// Filter queries
await base44.entities.Query.filter(
  { org_id: orgId, status: "completed" },
  '-created_date',
  20
);
\`\`\`

### Integrations
\`\`\`javascript
// Invoke LLM
await base44.integrations.Core.InvokeLLM({
  prompt: "Your prompt",
  add_context_from_internet: true,
  response_json_schema: { /* schema */ }
});

// Upload file
await base44.integrations.Core.UploadFile({
  file: fileObject
});
\`\`\``
};

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'copilot', label: 'Copilot', icon: Sparkles },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'rbac', label: 'Access Control', icon: Shield },
    { id: 'api', label: 'API Reference', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 min-h-screen p-6">
          <div className="flex items-center gap-2 mb-8">
            <Book className="h-6 w-6 text-slate-900" />
            <h1 className="text-xl font-semibold text-slate-900">Documentation</h1>
          </div>
          
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                  {activeSection === section.id && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">Need Help?</p>
            <p className="text-xs text-blue-700">
              Use Copilot to ask questions about these features.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <ReactMarkdown
                  className="prose prose-slate max-w-none"
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-slate-600 leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600">
                        {children}
                      </ul>
                    ),
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-slate-800">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto mb-4">
                          <code className="text-sm">{children}</code>
                        </pre>
                      ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">{children}</strong>
                    ),
                  }}
                >
                  {DOCUMENTATION[activeSection]}
                </ReactMarkdown>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}