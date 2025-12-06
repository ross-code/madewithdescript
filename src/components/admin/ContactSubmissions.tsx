import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Trash2, Mail, MailOpen, ExternalLink } from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export const ContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load contact submissions');
    } else {
      setSubmissions(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const toggleRead = async (id: string, currentRead: boolean) => {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ read: !currentRead })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      setSubmissions(prev =>
        prev.map(s => (s.id === id ? { ...s, read: !currentRead } : s))
      );
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this message?')) return;

    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      setSubmissions(prev => prev.filter(s => s.id !== id));
      toast.success('Message deleted');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} message(s)?`)) return;

    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .in('id', [...selectedIds]);

    if (error) {
      toast.error('Failed to delete');
    } else {
      setSubmissions(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      toast.success(`Deleted ${selectedIds.size} message(s)`);
    }
  };

  const handleBulkMarkRead = async (read: boolean) => {
    if (selectedIds.size === 0) return;

    const { error } = await supabase
      .from('contact_submissions')
      .update({ read })
      .in('id', [...selectedIds]);

    if (error) {
      toast.error('Failed to update');
    } else {
      setSubmissions(prev =>
        prev.map(s => (selectedIds.has(s.id) ? { ...s, read } : s))
      );
      setSelectedIds(new Set());
      toast.success(`Marked ${selectedIds.size} as ${read ? 'read' : 'unread'}`);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    }
  };

  const unreadCount = submissions.filter(s => !s.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={submissions.length > 0 && selectedIds.size === submissions.length}
            onCheckedChange={toggleSelectAll}
            disabled={submissions.length === 0}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : `${submissions.length} message(s)`}
            {unreadCount > 0 && selectedIds.size === 0 && (
              <Badge variant="secondary" className="ml-2">{unreadCount} unread</Badge>
            )}
          </span>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkMarkRead(true)}>
              <MailOpen className="w-3 h-3 mr-1" /> Mark Read
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkMarkRead(false)}>
              <Mail className="w-3 h-3 mr-1" /> Mark Unread
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Messages List */}
      {submissions.length === 0 ? (
        <div className="glass border border-border rounded-lg p-8 text-center">
          <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No contact messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className={`glass border rounded-lg p-4 transition-colors ${
                selectedIds.has(submission.id)
                  ? 'border-primary bg-primary/5'
                  : submission.read
                  ? 'border-border'
                  : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.has(submission.id)}
                  onCheckedChange={() => toggleSelect(submission.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-foreground">{submission.name}</span>
                    <a
                      href={`mailto:${submission.email}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {submission.email}
                    </a>
                    {!submission.read && (
                      <Badge className="bg-primary/20 text-primary text-xs">New</Badge>
                    )}
                  </div>
                  {submission.subject && (
                    <p className="text-sm font-medium text-foreground mb-1">
                      {submission.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {submission.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRead(submission.id, submission.read)}
                    title={submission.read ? 'Mark unread' : 'Mark read'}
                  >
                    {submission.read ? (
                      <Mail className="w-4 h-4" />
                    ) : (
                      <MailOpen className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubmission(submission.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
