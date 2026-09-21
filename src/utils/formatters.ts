import { format, parseISO } from 'date-fns';

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy, h:mm a');
  } catch {
    return iso;
  }
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}
