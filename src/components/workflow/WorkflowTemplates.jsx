import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, CheckSquare, FileText, MessageSquare, Bell } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const WORKFLOW_TEMPLATES = [
  {
    name: 'Share to Slack',
    description: 'Post saved queries to a Slack channel',
    icon: Send,
    category: 'Communication',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'Query',
      event_types: ['update'],
    },
    steps: [
      {
        id: 'check_saved',
        type: 'condition',
        config: {
          description: 'Check if query was saved',
          condition: 'data.is_saved === true'
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'post_slack',
        type: 'action',
        config: {
          integration_type: 'slack',
          action_id: 'post_message',
          description: 'Post to Slack channel',
          parameters: {
            channel: '#insights',
            message: '📌 New saved insight: {{data.prompt}}\n\n{{data.response}}'
          }
        },
        position: { x: 300, y: 100 }
      }
    ]
  },
  {
    name: 'Create Task from Query',
    description: 'Convert queries into project tasks',
    icon: CheckSquare,
    category: 'Productivity',
    trigger_type: 'copilot_query',
    trigger_config: {
      keywords: ['task', 'todo', 'action item']
    },
    steps: [
      {
        id: 'extract_task',
        type: 'action',
        config: {
          description: 'Extract task details',
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'create_linear',
        type: 'action',
        config: {
          integration_type: 'linear',
          action_id: 'create_issue',
          description: 'Create Linear issue',
          parameters: {
            team_id: 'default',
            title: '{{task.title}}',
            description: '{{task.description}}'
          }
        },
        position: { x: 300, y: 100 }
      }
    ]
  },
  {
    name: 'Query to Documentation',
    description: 'Save important queries as knowledge articles',
    icon: FileText,
    category: 'Knowledge',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'Query',
      event_types: ['update'],
    },
    steps: [
      {
        id: 'check_flagged',
        type: 'condition',
        config: {
          description: 'Check if marked for documentation',
          condition: 'data.is_saved === true && data.response_type === "answer"'
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'create_kb',
        type: 'action',
        config: {
          description: 'Create knowledge base article',
          entity_name: 'KnowledgeBase',
          action: 'create',
          data: {
            title: '{{data.prompt}}',
            content: '{{data.response}}',
            category: 'auto-generated',
            source_type: 'query'
          }
        },
        position: { x: 300, y: 100 }
      }
    ]
  },
  {
    name: 'Alert on Critical Insights',
    description: 'Notify team when AI detects important information',
    icon: Bell,
    category: 'Monitoring',
    trigger_type: 'copilot_query',
    trigger_config: {},
    steps: [
      {
        id: 'analyze_importance',
        type: 'action',
        config: {
          description: 'AI analyzes query importance',
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'check_critical',
        type: 'condition',
        config: {
          description: 'Is it critical?',
          condition: 'importance_score > 8'
        },
        position: { x: 300, y: 100 }
      },
      {
        id: 'notify_slack',
        type: 'action',
        config: {
          integration_type: 'slack',
          action_id: 'post_message',
          description: 'Send alert to team',
          parameters: {
            channel: '#alerts',
            message: '🚨 Critical insight detected: {{data.prompt}}'
          }
        },
        position: { x: 500, y: 100 }
      }
    ]
  }
];

export default function WorkflowTemplates({ orgId, onSelectTemplate }) {
  const queryClient = useQueryClient();

  const createFromTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const workflow = await base44.entities.Workflow.create({
        org_id: orgId,
        name: template.name,
        description: template.description,
        trigger_type: template.trigger_type,
        trigger_config: template.trigger_config,
        steps: template.steps,
        is_active: false,
      });
      return workflow;
    },
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created from template', {
        description: 'Configure and activate it when ready',
        action: {
          label: 'Configure',
          onClick: () => onSelectTemplate?.(workflow)
        }
      });
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {WORKFLOW_TEMPLATES.map((template, idx) => (
        <Card key={idx} className="border border-slate-200 hover:shadow-md transition-all duration-200">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <template.icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-700">{template.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{template.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {template.steps.length} steps
              </span>
              <Button
                size="sm"
                onClick={() => createFromTemplateMutation.mutate(template)}
                disabled={createFromTemplateMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Use Template
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}