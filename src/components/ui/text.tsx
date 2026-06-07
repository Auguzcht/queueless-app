import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn('text-foreground text-base leading-6', Platform.select({ web: 'select-text' })),
  {
    variants: {
      variant: {
        default: '',
        // Display / Hero — 36px, ExtraBold, tight leading, negative tracking
        h1: cn('text-[36px] font-extrabold leading-[42px] tracking-[-1px]', Platform.select({ web: 'scroll-m-20' })),
        // Section header — 28px, Bold
        h2: cn('text-[28px] font-bold leading-[34px] tracking-[-0.5px]', Platform.select({ web: 'scroll-m-20' })),
        // Card header — 22px, Bold
        h3: cn('text-[22px] font-bold leading-[28px]', Platform.select({ web: 'scroll-m-20' })),
        // Subheader — 18px, SemiBold
        h4: cn('text-lg font-semibold leading-6', Platform.select({ web: 'scroll-m-20' })),
        // Body — 16px, Regular, generous line height
        p: 'text-base leading-6 text-muted-foreground',
        // Large body — 18px
        lead: 'text-lg leading-7 text-muted-foreground',
        // Large label — 16px SemiBold
        large: 'text-base font-semibold',
        // Small / caption — 13px
        small: 'text-sm leading-4 text-muted-foreground',
        // Muted caption — 12px
        muted: 'text-xs leading-4 text-muted-foreground',
        // Blockquote
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        // Code
        code: cn('bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'),
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;
type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = { h1: '1', h2: '2', h3: '3', h4: '4' };

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className, asChild = false, variant = 'default', ...props
}: React.ComponentProps<typeof RNText> & React.RefAttributes<typeof RNText> & TextVariantProps & { asChild?: boolean }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
