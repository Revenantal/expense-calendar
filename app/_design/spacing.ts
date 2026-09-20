/**
 * Spacing scale shared across layout and components.
 *
 * Replace these placeholder values with the project's real spacing scale.
 */

export type SpacingToken = {
  label: string
  size: number
  cssVariable?: string
  usage: string
}

export const spacingTokens = {
  xxs: {
    label: '2xs',
    size: 4,
    usage: 'Fine details and tight offsets.',
  },
  xs: {
    label: 'xs',
    size: 8,
    usage: 'Icon gaps and compact stacks.',
  },
  sm: {
    label: 'sm',
    size: 12,
    usage: 'Small component padding.',
  },
  md: {
    label: 'md',
    size: 16,
    usage: 'Default inline rhythm.',
  },
  lg: {
    label: 'lg',
    size: 24,
    usage: 'Card and grid gutters.',
  },
  xl: {
    label: 'xl',
    size: 32,
    usage: 'Block padding and grouped content.',
  },
  xxl: {
    label: '2xl',
    size: 48,
    usage: 'Large CTA and layout spacing.',
  },
  section: {
    label: 'section',
    size: 80,
    usage: 'Standard section rhythm.',
  },
} as const satisfies Record<string, SpacingToken>
