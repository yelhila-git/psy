'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: 'underline' | 'pill' | 'sidebar';
  }
>(({ className, variant = 'underline', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-variant={variant}
    className={cn(
      'flex items-center',
      variant === 'underline' && 'no-scrollbar gap-6 overflow-x-auto border-b border-border',
      variant === 'pill' && 'gap-1 rounded-control bg-muted p-1',
      variant === 'sidebar' && 'flex-col items-stretch gap-1',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * The active tab treatment follows the Figma profile sidebar: a teal marker
 * plus a weight change, never a colour-only cue.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: 'underline' | 'pill' | 'sidebar';
  }
>(({ className, variant = 'underline', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'whitespace-nowrap font-ui text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      variant === 'underline' &&
        'relative -mb-px shrink-0 border-b-2 border-transparent pb-3 pt-1 text-muted-foreground hover:text-secondary data-[state=active]:border-primary data-[state=active]:font-semibold data-[state=active]:text-secondary',
      variant === 'pill' &&
        'flex-1 rounded-[3px] px-4 py-2 text-muted-foreground data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-secondary data-[state=active]:shadow-soft',
      variant === 'sidebar' &&
        'relative flex items-center gap-3 rounded-control px-4 py-3 text-start text-muted-foreground hover:bg-muted hover:text-secondary data-[state=active]:bg-primary-soft/60 data-[state=active]:font-semibold data-[state=active]:text-secondary data-[state=active]:before:absolute data-[state=active]:before:inset-y-2 data-[state=active]:before:start-0 data-[state=active]:before:w-1 data-[state=active]:before:rounded-full data-[state=active]:before:bg-primary [&_svg]:size-[18px] [&_svg]:shrink-0',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
