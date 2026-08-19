'use client';

import * as React from 'react';
import { Camera } from 'lucide-react';
import { Avatar, type AvatarProps } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Avatar with a camera button that opens the file picker and previews the
 * selection immediately. There is no upload endpoint yet, so the chosen image
 * lives in component state — `onChange` hands the data URL to the parent form.
 */
export function AvatarUpload({
  initialSrc,
  name,
  size = '2xl',
  square,
  ring,
  onChange,
}: {
  initialSrc?: string;
  name: string;
  size?: AvatarProps['size'];
  square?: boolean;
  ring?: boolean;
  onChange?: (dataUrl: string) => void;
}) {
  const { toast } = useToast();
  const [src, setSrc] = React.useState(initialSrc);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clearing the input lets the same file be picked twice in a row.
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format non pris en charge',
        description: 'Choisissez une image (JPEG, PNG ou WebP).',
        variant: 'error',
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: 'Image trop lourde',
        description: 'La taille maximale est de 5 Mo.',
        variant: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSrc(dataUrl);
      onChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative mx-auto w-fit">
      <Avatar src={src} name={name} size={size} square={square} ring={ring} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute -end-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-colors hover:bg-primary-hover"
        aria-label="Changer la photo"
      >
        <Camera className="size-4" />
      </button>
    </div>
  );
}
