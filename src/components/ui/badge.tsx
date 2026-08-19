import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppointmentStatus, PaymentStatus, VerificationStatus } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The specialty chip from the Figma profile: white fill, teal outline.
        default: 'border-border-strong bg-background text-muted-foreground',
        primary: 'border-transparent bg-primary-soft text-primary',
        solid: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary-soft text-secondary',
        navy: 'border-transparent bg-secondary text-white',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-warning-soft text-warning',
        error: 'border-transparent bg-error-soft text-error',
        info: 'border-transparent bg-info-soft text-secondary',
        outline: 'border-border bg-transparent text-muted-foreground',
        onDark: 'border-white/25 bg-white/10 text-white backdrop-blur-sm',
      },
      size: {
        sm: 'px-2.5 py-0.5 text-2xs [&_svg]:size-3',
        default: 'px-3 py-1 text-xs [&_svg]:size-3.5',
        lg: 'px-4 py-1.5 text-base [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/** The teal check seen next to every approved practitioner in the Figma. */
export function VerifiedBadge({
  className,
  label = 'Vérifié',
  showLabel = true,
  size = 'default',
}: {
  className?: string;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  if (!showLabel) {
    return (
      <span
        className={cn('inline-flex text-primary', className)}
        title={label}
        aria-label={label}
        role="img"
      >
        <BadgeCheck className={size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5'} />
      </span>
    );
  }
  return (
    <Badge variant="primary" size={size} className={className}>
      <BadgeCheck aria-hidden />
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge — one place that maps every domain status to its visual weight.
// ---------------------------------------------------------------------------

const APPOINTMENT_STATUS: Record<
  AppointmentStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  pending_payment: { label: 'Paiement en attente', variant: 'warning' },
  payment_confirmation: { label: 'Paiement à confirmer', variant: 'info' },
  confirmed: { label: 'Confirmé', variant: 'success' },
  in_progress: { label: 'En cours', variant: 'primary' },
  completed: { label: 'Terminé', variant: 'info' },
  cancelled: { label: 'Annulé', variant: 'error' },
  no_show: { label: 'Absence', variant: 'error' },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
  payment_free: { label: 'Première consultation gratuite', variant: 'success' },
  payment_pending: { label: 'En attente de transfert', variant: 'warning' },
  payment_proof_submitted: { label: 'À confirmer', variant: 'info' },
  payment_confirmed: { label: 'Paiement confirmé', variant: 'success' },
  payment_rejected: { label: 'Non reçu', variant: 'error' },
  payment_expired: { label: 'Délai dépassé', variant: 'outline' },
};

const VERIFICATION_STATUS: Record<
  VerificationStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  pending: { label: 'En attente', variant: 'warning' },
  approved: { label: 'Approuvé', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'error' },
  suspended: { label: 'Suspendu', variant: 'error' },
};

export type StatusKind = 'appointment' | 'payment' | 'verification';

export function StatusBadge({
  kind,
  status,
  size,
  className,
}: {
  kind: StatusKind;
  status: AppointmentStatus | PaymentStatus | VerificationStatus;
  size?: BadgeProps['size'];
  className?: string;
}) {
  const map =
    kind === 'appointment'
      ? APPOINTMENT_STATUS
      : kind === 'payment'
        ? PAYMENT_STATUS
        : VERIFICATION_STATUS;

  const entry = (map as Record<string, { label: string; variant: BadgeProps['variant'] }>)[status];
  if (!entry) return null;

  return (
    <Badge variant={entry.variant} size={size} className={className}>
      {entry.label}
    </Badge>
  );
}

export { Badge, badgeVariants };
