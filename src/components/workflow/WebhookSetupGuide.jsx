import React from 'react';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const INTEGRATION_GUIDES = {
  googledrive: {
    name: 'Google Drive',
    steps: [
      'Go to Google Cloud Console',
      'Enable Google Drive API',
      'Create a Cloud Pub/Sub topic',
      'Set up a push notification channel',
      'Configure the push endpoint to your webhook URL',
    ],
    docsUrl: 'https://developers.google.com/drive/api/guides/push',
  },
  gmail: {
    name: 'Gmail',
    steps: [
      'Go to Google Cloud Console',
      'Enable Gmail API',
      'Set up Cloud Pub/Sub topic',
      'Create push notification configuration',
      'Subscribe to mailbox changes',
    ],
    docsUrl: 'https://developers.google.com/gmail/api/guides/push',
  },
  jira: {
    name: 'Jira',
    steps: [
      'Go to your Jira project settings',
      'Navigate to System → WebHooks',
      'Click "Create a WebHook"',
      'Paste your webhook URL',
      'Select events to trigger (issue created, updated, etc.)',
    ],
    docsUrl: 'https://developer.atlassian.com/server/jira/platform/webhooks/',
  },
  slack: {
    name: 'Slack',
    steps: [
      'Go to api.slack.com/apps',
      'Select your app or create new one',
      'Navigate to Event Subscriptions',
      'Enable Events and paste your webhook URL',
      'Subscribe to bot events (message.channels, etc.)',
    ],
    docsUrl: 'https://api.slack.com/events',
  },
  github: {
    name: 'GitHub',
    steps: [
      'Go to your repository settings',
      'Click Webhooks → Add webhook',
      'Paste your webhook URL',
      'Select events (push, pull request, issues)',
      'Set content type to application/json',
    ],
    docsUrl: 'https://docs.github.com/en/webhooks',
  },
};

export default function WebhookSetupGuide({ integrationType, webhookUrl }) {
  const guide = INTEGRATION_GUIDES[integrationType];
  
  if (!guide) {
    return (
      <div className="text-sm text-slate-500">
        Configure this integration's webhook to point to the URL above
      </div>
    );
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied');
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="h-4 w-4 text-blue-600" />
          Setup {guide.name} Webhook
        </CardTitle>
        <CardDescription>Follow these steps to connect {guide.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-700 mb-2">Your Webhook URL:</div>
          <div className="flex gap-2">
            <div className="flex-1 p-2 bg-white border border-slate-200 rounded text-xs font-mono break-all">
              {webhookUrl}
            </div>
            <Button size="sm" variant="outline" onClick={copyUrl}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700 mb-2">Configuration Steps:</div>
          {guide.steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {idx + 1}
              </div>
              <p className="text-sm text-slate-700 pt-0.5">{step}</p>
            </div>
          ))}
        </div>

        <a
          href={guide.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          View Official Documentation
        </a>
      </CardContent>
    </Card>
  );
}