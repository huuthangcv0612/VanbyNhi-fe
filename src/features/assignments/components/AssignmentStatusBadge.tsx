import { getAssignmentStatusMeta } from '../utils/assignment.utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface AssignmentStatusBadgeProps {
  status: string | null | undefined;
  isLate?: boolean;
  className?: string;
}

export function AssignmentStatusBadge({ status, isLate, className }: AssignmentStatusBadgeProps) {
  const effectiveStatus = isLate && status === 'SUBMITTED' ? 'LATE' : status;
  const meta = getAssignmentStatusMeta(effectiveStatus);

  return (
    <Badge
      size="sm"
      className={cn(
        'font-medium text-xs px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1.5',
        meta.badgeClass,
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{meta.label}</span>
    </Badge>
  );
}
