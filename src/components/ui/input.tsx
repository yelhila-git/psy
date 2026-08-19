import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rendered inside the field, before the text — search icons, currency, etc. */
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, invalid, ...props }, ref) => {
    const field = (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-11 w-full rounded-control border bg-background px-4 text-base text-foreground transition-colors',
          'placeholder:text-subtle-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary',
          'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
          'file:border-0 file:bg-transparent file:text-base file:font-medium',
          invalid ? 'border-error focus:border-error focus:ring-error/30' : 'border-input',
          startAdornment && 'ps-10',
          endAdornment && 'pe-10',
          className,
        )}
        {...props}
      />
    );

    if (!startAdornment && !endAdornment) return field;

    return (
      <div className="relative w-full">
        {startAdornment && (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-subtle-foreground [&_svg]:size-4">
            {startAdornment}
          </span>
        )}
        {field}
        {endAdornment && (
          <span className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-subtle-foreground [&_svg]:size-4">
            {endAdornment}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'min-h-[110px] w-full rounded-control border bg-background px-4 py-3 text-base text-foreground transition-colors',
      'placeholder:text-subtle-foreground',
      'focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary',
      'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
      invalid ? 'border-error' : 'border-input',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

/** Field wrapper: label, optional hint, and inline error message. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-base font-medium text-secondary">
          {label}
          {required && <span className="ms-1 text-error">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export { Input, Textarea };
