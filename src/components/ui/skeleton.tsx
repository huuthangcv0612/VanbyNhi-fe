import React from 'react';
import { cn } from '@/utils/cn';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
          <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
          <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
          <td className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></td>
        </tr>
      ))}
    </>
  );
}
