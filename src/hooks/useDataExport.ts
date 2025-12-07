import { useCallback } from 'react';
import { toast } from 'sonner';

interface ExportOptions {
  filename: string;
  headers: string[];
  data: Record<string, unknown>[];
  columns: string[];
}

export const useDataExport = () => {
  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = useCallback(({ filename, headers, data, columns }: ExportOptions) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    const headerRow = headers.map(escapeCSVValue).join(',');
    const dataRows = data.map(row => 
      columns.map(col => escapeCSVValue(row[col])).join(',')
    );
    const csvContent = [headerRow, ...dataRows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${data.length} record(s) to CSV`);
  }, []);

  const exportProjectsToCSV = useCallback((projects: Record<string, unknown>[]) => {
    exportToCSV({
      filename: 'projects',
      headers: ['Name', 'Description', 'URL', 'Category', 'Status', 'Featured', 'Submitter Email', 'Created At', 'Updated At'],
      columns: ['name', 'description', 'url', 'category', 'status', 'featured', 'submitterEmail', 'createdAt', 'updatedAt'],
      data: projects.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
      })),
    });
  }, [exportToCSV]);

  const exportContactsToCSV = useCallback((contacts: Record<string, unknown>[]) => {
    exportToCSV({
      filename: 'contact-submissions',
      headers: ['Name', 'Email', 'Subject', 'Message', 'Read', 'Created At'],
      columns: ['name', 'email', 'subject', 'message', 'read', 'created_at'],
      data: contacts,
    });
  }, [exportToCSV]);

  return { exportToCSV, exportProjectsToCSV, exportContactsToCSV };
};
