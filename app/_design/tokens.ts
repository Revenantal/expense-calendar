/**
 * Keyed design token metadata.
 *
 * Runtime values live in `app/globals.css`. These registries hold the
 * human-readable metadata so components reference one shared definition
 * instead of drifting to slightly different hardcoded values.
 *
 * Replace these placeholder tokens with the project's real design values.
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
    value: '#ffffff',
    cssVariable: '--color-surface',
    className: 'bg-surface',
    usage: 'Page background.',
  },
  panel: {
    label: 'Panel',
    value: '#f5f5f5',
    cssVariable: '--color-panel',
    className: 'bg-panel',
    usage: 'Cards, sidebars, and inset blocks.',
  },
  line: {
    label: 'Line',
    value: '#e0e0e0',
    cssVariable: '--color-line',
    className: 'bg-line',
    usage: 'Hairline borders and dividers.',
  },
  accent: {
    label: 'Accent',
    value: '#1a56db',
    cssVariable: '--color-accent',
    className: 'bg-accent',
    usage: 'Primary actions and active states.',
  },
  ink: {
    label: 'Ink',
    value: '#111827',
    cssVariable: '--color-ink',
    className: 'bg-ink',
    usage: 'Headings and high-contrast text.',
  },
  body: {
    label: 'Body text',
    value: '#374151',
    cssVariable: '--color-body',
    className: 'bg-body',
    usage: 'Default paragraph copy.',
  },
  muted: {
    label: 'Muted text',
    value: '#6b7280',
    cssVariable: '--color-muted',
    className: 'bg-muted',
    usage: 'Labels, captions, and legal text.',
  },
} as const satisfies Record<string, ColorToken>

export const shadowTokens = {
  raised: {
    label: 'Raised',
    value: '0 1px 3px rgba(0, 0, 0, 0.12)',
    cssVariable: '--shadow-raised',
    className: 'shadow-raised',
    usage: 'Cards and elevated panels.',
  },
  overlay: {
    label: 'Overlay',
    value: '0 12px 32px rgba(0, 0, 0, 0.18)',
    cssVariable: '--shadow-overlay',
    className: 'shadow-overlay',
    usage: 'Drawers, dropdowns, and modal-style overlays.',
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

export const layoutTokens = {
  containerMaxWidth: '1280px',
  desktopEdgePadding: '40px',
  mobileEdgePadding: '20px',
  columnGutter: '24px',
  sectionRhythm: '80px',
} as const
