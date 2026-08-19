'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, initials } from '@/lib/utils';

const SIZES = {
  xs: 'size-8 text-2xs',
  sm: 'size-10 text-xs',
  default: 'size-12 text-base',
  lg: 'size-16 text-md',
  xl: 'size-20 text-lg',
  '2xl': 'size-28 text-xl',
  '3xl': 'size-36 text-2xl',
} as const;

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  name: string;
  size?: keyof typeof SIZES;
  /** The teal ring around the practitioner photo on the Figma profile header. */
  ring?: boolean;
  /** Square with a 10px radius, as used in the profile header card. */
  square?: boolean;
}

export function Avatar({ src, name, size = 'default', ring, square, className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden bg-primary-soft',
        square ? 'rounded-card' : 'rounded-full',
        ring && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        SIZES[size],
        className,
      )}
      {...props}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        delayMs={src ? 400 : 0}
        className="flex h-full w-full items-center justify-center font-bold uppercase text-primary"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/** Overlapping avatar row used for social proof ("+2400 patients accompagnés"). */
export function AvatarGroup({
  people,
  max = 4,
  size = 'sm',
  className,
}: {
  people: { name: string; avatarUrl?: string }[];
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <div className={cn('flex items-center -space-x-3 rtl:space-x-reverse', className)}>
      {shown.map((person, i) => (
        <Avatar
          key={`${person.name}-${i}`}
          src={person.avatarUrl}
          name={person.name}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'z-10 flex items-center justify-center rounded-full bg-secondary font-bold text-white ring-2 ring-background',
            SIZES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
