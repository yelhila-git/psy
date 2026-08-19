import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button variants mirror the Figma header and CTA treatments:
 *  - `default`  filled teal, pill radius  ("Prise de RDV", "Discover More")
 *  - `outline`  teal border on white       ("Connexion")
 *  - `secondary` filled navy               (dark-section CTAs)
 *  - `soft`     teal tint, no border       (tertiary actions in dashboards)
 *  - `onDark`   white fill over navy/photo (hero secondary CTA)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-[0.99]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:scale-[0.99]',
        accent: 'bg-accent text-accent-foreground hover:brightness-110 active:scale-[0.99]',
        outline:
          'border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground',
        'outline-muted':
          'border border-border bg-background text-foreground hover:border-primary hover:text-primary',
        soft: 'bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        onDark: 'bg-white text-secondary hover:bg-white/90 active:scale-[0.99]',
        'onDark-outline': 'border border-white/60 text-white hover:bg-white/10',
        destructive: 'bg-error text-error-foreground hover:brightness-110',
      },
      size: {
        sm: 'h-9 px-4 text-xs [&_svg]:size-4',
        default: 'h-11 px-6 text-base [&_svg]:size-4',
        lg: 'h-[52px] px-8 text-md [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
        'icon-sm': 'size-9 [&_svg]:size-4',
      },
      full: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'default', size: 'default', full: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // `asChild` forwards to a single element (usually a Link), so the spinner
    // is only injected when we own the markup.
    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, full, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, full, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
