/**
 * Keyed design token metadata.
 *
 * Runtime values live in the `@theme inline` block in `app/globals.css`.
 * These registries hold the human-readable metadata so components reference
 * one shared definition instead of drifting to slightly different hardcoded
 * values.
 *
 * Changing a value here does nothing on its own — update `globals.css` too.
 *
 * The theme is dark only. Contrast ratios against `surface` are noted where
 * they matter; they were measured, not estimated.
 */

export type ColorToken = {
  label: string
  value: string
  cssVariable: string
  className: string
  usage: string
}

export type ShadowToken = {
  label: string
  value: string
  cssVariable: string
  className: string
  usage: string
}

export type BorderToken = {
  label: string
  value: string
  usage: string
}

export const colorTokens = {
  surface: {
    label: 'Surface',
    value: '#1a1a19',
    cssVariable: '--color-surface',
    className: 'bg-surface',
    usage: 'Calendar grid and chart background.',
  },
  panel: {
    label: 'Panel',
    value: '#212120',
    cssVariable: '--color-panel',
    className: 'bg-panel',
    usage: 'Side panels, day cells, and inset blocks.',
  },
  raised: {
    label: 'Raised',
    value: '#2a2a28',
    cssVariable: '--color-raised',
    className: 'bg-raised',
    usage: 'Modals, menus, and hovered cells.',
  },
  line: {
    label: 'Line',
    value: '#3a3a37',
    cssVariable: '--color-line',
    className: 'bg-line',
    usage: 'Grid lines, borders, and dividers.',
  },
  lineStrong: {
    label: 'Line strong',
    value: '#4d4d49',
    cssVariable: '--color-line-strong',
    className: 'bg-line-strong',
    usage: 'Chart zero line and emphasised edges.',
  },
  ink: {
    label: 'Ink',
    value: '#f5f5f3',
    cssVariable: '--color-ink',
    className: 'bg-ink',
    usage: 'Headings, amounts, and high-contrast text. 15.96:1.',
  },
  body: {
    label: 'Body text',
    value: '#c3c2b7',
    cssVariable: '--color-body',
    className: 'bg-body',
    usage: 'Default copy and transaction labels. 9.72:1.',
  },
  muted: {
    label: 'Muted text',
    value: '#8a8a82',
    cssVariable: '--color-muted',
    className: 'bg-muted',
    usage: 'Captions, weekday headings, and axis labels. 5.01:1.',
  },
  past: {
    label: 'Past day',
    value: '#6e6e68',
    cssVariable: '--color-past',
    className: 'bg-past',
    usage: 'De-emphasised past days. Faded but still legible at 3.39:1.',
  },
  income: {
    label: 'Income',
    value: '#3987e5',
    cssVariable: '--color-income',
    className: 'bg-income',
    usage: 'Income amounts and chart bars above the baseline. 4.79:1.',
  },
  expense: {
    label: 'Expense',
    value: '#e66767',
    cssVariable: '--color-expense',
    className: 'bg-expense',
    usage: 'Expense amounts and chart bars below the baseline. 5.39:1.',
  },
  accent: {
    label: 'Accent',
    value: '#3987e5',
    cssVariable: '--color-accent',
    className: 'bg-accent',
    usage: 'Focus rings, selection, and primary actions.',
  },
  holiday: {
    label: 'Holiday',
    value: '#c98500',
    cssVariable: '--color-holiday',
    className: 'bg-holiday',
    usage: 'Payment-affecting holidays. Paired with a marker, never colour alone.',
  },
  holidayMuted: {
    label: 'Holiday informational',
    value: '#7a6a4a',
    cssVariable: '--color-holiday-muted',
    className: 'bg-holiday-muted',
    usage: 'Holidays that do not stop payments processing.',
  },
} as const satisfies Record<string, ColorToken>

export const shadowTokens = {
  raised: {
    label: 'Raised',
    value: '0 1px 3px rgba(0, 0, 0, 0.4)',
    cssVariable: '--shadow-raised',
    className: 'shadow-raised',
    usage: 'Cards and elevated panels. Deeper than a light theme needs.',
  },
  overlay: {
    label: 'Overlay',
    value: '0 12px 32px rgba(0, 0, 0, 0.55)',
    cssVariable: '--shadow-overlay',
    className: 'shadow-overlay',
    usage: 'Menus and modals.',
  },
} as const satisfies Record<string, ShadowToken>

export const borderTokens = {
  hairline: {
    label: 'Hairline',
    value: '1px',
    usage: 'Panel edges and dividers.',
  },
  emphasis: {
    label: 'Emphasis',
    value: '3px',
    usage: 'Active states and leading edges.',
  },
} as const satisfies Record<string, BorderToken>

export const radiusTokens = {
  pill: {
    label: 'Pill',
    value: '9999px',
    usage: 'Chips, badges, and transaction pills inside a day cell.',
  },
  panel: {
    label: 'Panel',
    value: '1rem',
    usage: 'Day cells and side panels — rounded-2xl.',
  },
  control: {
    label: 'Control',
    value: '0.5rem',
    usage: 'Buttons, inputs, and nav controls — rounded-lg.',
  },
} as const satisfies Record<string, BorderToken>

export const layoutTokens = {
  containerMaxWidth: '1280px',
  desktopEdgePadding: '40px',
  mobileEdgePadding: '20px',
  columnGutter: '24px',
  sectionRhythm: '80px',
} as const
