import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Webhook, ExternalLink } from 'lucide-react';

export const AdminSettings = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'submission_webhook_url')
        .single();

      if (!error && data) {
        setWebhookUrl(data.value);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: webhookUrl, updated_at: new Date().toISOString() })
      .eq('key', 'submission_webhook_url');

    if (error) {
      console.error('Error saving webhook URL:', error);
      toast.error('Failed to save webhook URL');
    } else {
      toast.success('Webhook URL saved!');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Webhook className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">
            Submission Webhook
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Forward new project submissions to an external service like Zapier, Make, or any webhook endpoint. 
          The submission data (name, description, URL, category, email) will be sent as JSON.
        </p>

        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            className="glass border-border"
          />
          <p className="text-xs text-muted-foreground">
            Paste your Zapier, Make, or custom webhook URL here. Leave empty to disable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <div className="glass border border-border rounded-lg p-6 space-y-3">
        <h4 className="font-medium text-foreground">How to set up</h4>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Create a Zap in <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Zapier <ExternalLink className="w-3 h-3" /></a> or a scenario in <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Make <ExternalLink className="w-3 h-3" /></a></li>
          <li>Add a <strong>Webhook</strong> trigger and copy the webhook URL</li>
          <li>Paste the URL above and click Save</li>
          <li>Connect the webhook to Google Sheets, Tally, Notion, or any other app</li>
        </ol>
        <div className="mt-3 p-3 rounded border border-border bg-muted/30">
          <p className="text-xs font-medium text-foreground mb-1">Payload fields sent:</p>
          <code className="text-xs text-muted-foreground">
            project_name, project_description, project_url, project_category, project_id, submitter_email, image_url, submitted_at
          </code>
        </div>
      </div>
    </div>
  );
};
