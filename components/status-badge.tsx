import { cn } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/lib/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '@/lib/types';

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        ORDER_STATUS_COLORS[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const colors: Record<PaymentStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    initiated: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    verified: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30',
    refunded: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colors[status],
        className
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
