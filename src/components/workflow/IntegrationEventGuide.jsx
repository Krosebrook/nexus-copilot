import React from 'react';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EVENT_GUIDES = {
  'googledrive': {
    'file.created': {
      description: 'Triggered when a new file is created in Google Drive',
      setup: 'Requires Google Cloud Pub/Sub setup and Drive API push notifications',
      payload_example: { file: { id: 'file_id', name: 'document.pdf', mimeType: 'application/pdf' } },
    },
    'file.updated': {
      description: 'Triggered when a file is modified',
      setup: 'Same as file.created - uses Drive API push notifications',
      payload_example: { file: { id: 'file_id', name: 'document.pdf', modifiedTime: '2024-01-01T10:00:00Z' } },
    },
  },
  'gmail': {
    'email.received': {
      description: 'Triggered when a new email is received',
      setup: 'Requires Gmail API push notifications via Cloud Pub/Sub',
      payload_example: { message: { id: 'msg_id', threadId: 'thread_id', from: 'sender@example.com', subject: 'Hello' } },
    },
  },
  'jira': {
    'issue.created': {
      description: 'Triggered when a new Jira issue is created',
      setup: 'Configure in Jira: System → WebHooks',
      payload_example: { issue: { key: 'PROJ-123', fields: { summary: 'Bug report', status: 'Open' } } },
    },
    'issue.updated': {
      description: 'Triggered when an issue is updated',
      setup: 'Same as issue.created',
      payload_example: { issue: { key: 'PROJ-123', changelog: { items: [{ field: 'status', toString: 'Done' }] } } },
    },
  },
  'slack': {
    'message.posted': {
      description: 'Triggered when a message is posted in a channel',
      setup: 'Configure at api.slack.com/apps → Event Subscriptions',
      payload_example: { event: { type: 'message', user: 'U123', text: 'Hello', channel: 'C123' } },
    },
  },
  'github': {
    'push': {
      description: 'Triggered when code is pushed to a repository',
      setup: 'Configure in repo Settings → Webhooks',
      payload_example: { commits: [{ message: 'Fix bug', author: { name: 'John' } }], ref: 'refs/heads/main' },
    },
    'pull_request.opened': {
      description: 'Triggered when a pull request is opened',
      setup: 'Same as push event',
      payload_example: { pull_request: { title: 'New feature', state: 'open', user: { login: 'john' } } },
    },
  },
};

export default function IntegrationEventGuide({ integrationType, eventType }) {
  const guide = EVENT_GUIDES[integrationType]?.[eventType];

  if (!guide) return null;

  return (
    <Card className="border-indigo-200 bg-indigo-50/50 mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-indigo-600" />
          Event Configuration
        </CardTitle>
        <CardDescription className="text-xs">{guide.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {guide.setup}
          </AlertDescription>
        </Alert>

        <div>
          <div className="text-xs font-medium text-slate-700 mb-2">Expected Payload Structure:</div>
          <pre className="text-xs bg-white p-3 rounded border border-slate-200 overflow-auto">
            {JSON.stringify(guide.payload_example, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}