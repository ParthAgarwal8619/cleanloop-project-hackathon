import type { Priority, ReportStatus } from '@/types';

export function priorityColor(priority: Priority | string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'LOW':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function priorityDot(priority: Priority | string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-500';
    case 'HIGH':
      return 'bg-orange-500';
    case 'MEDIUM':
      return 'bg-yellow-500';
    case 'LOW':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

export function statusColor(status: ReportStatus | string): string {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'AI_ANALYZED':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'ASSIGNED':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'IN_PROGRESS':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'COLLECTED':
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'AI_VERIFIED':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'RESOLVED':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function statusLabel(status: ReportStatus | string): string {
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    AI_ANALYZED: 'AI Verified',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    COLLECTED: 'Collected',
    AI_VERIFIED: 'AI Verified',
    RESOLVED: 'Resolved',
  };
  return labels[status] || status;
}

export function priorityLabel(priority: Priority | string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function wasteTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    plastic: 'Plastic',
    organic: 'Organic',
    paper: 'Paper',
    metal: 'Metal',
    glass: 'Glass',
    e_waste: 'E-Waste',
    mixed: 'Mixed',
  };
  return labels[type] || type;
}

export function wasteTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    plastic: 'Plastic',
    organic: 'Organic',
    paper: 'Paper',
    metal: 'Metal',
    glass: 'Glass',
    e_waste: 'E-Waste',
    mixed: 'Mixed',
  };
  return icons[type] || type;
}

export function formatCurrency(value: number): string {
  return '₹' + value.toLocaleString('en-IN');
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

export function formatKg(value: number): string {
  return value.toLocaleString('en-IN') + ' kg';
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateReportId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999) + 1;
  return `CL-${year}-${random.toString().padStart(6, '0')}`;
}
