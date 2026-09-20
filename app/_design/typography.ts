/**
 * Typography roles shared across pages and components.
 *
 * Replace these placeholder roles with the project's real type scale.
 */

export type TypographyRole = {
  role: string
  token: string
  className: string
  description: string
  sample: string
}

export const typographyRoles = {
  display: {
    role: 'Display',
    token: 'text-display',
    className:
      'font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.01em] text-ink text-balance md:text-[64px]',
    description: 'Homepage hero H1. Keep it short.',
    sample: 'Display heading',
  },
  pageTitle: {
    role: 'Page title',
    token: 'text-title',
    className: 'font-display text-[34px] font-semibold leading-[1.1] text-ink md:text-[44px]',
    description: 'Interior page H1.',
    sample: 'Page title',
  },
  section: {
    role: 'Section',
    token: 'text-3xl',
    className: 'font-display text-[26px] font-medium leading-[1.2] text-ink md:text-[32px]',
    description: 'Section headings and major module titles.',
    sample: 'Section heading',
  },
  cardTitle: {
    role: 'Card title',
    token: 'text-xl',
    className: 'font-display text-[19px] font-medium leading-[1.3] text-ink md:text-[21px]',
    description: 'Card titles and compact block headings.',
    sample: 'Card title',
  },
  lead: {
    role: 'Lead',
    token: 'text-lg',
    className: 'font-body text-lg leading-[1.65] text-body text-pretty',
    description: 'Hero and intro copy with generous line height.',
    sample: 'Lead paragraph copy used for page and section introductions.',
  },
  body: {
    role: 'Body',
    token: 'text-base',
    className: 'font-body text-base leading-[1.7] text-body text-pretty',
    description: 'Default paragraph and list copy.',
    sample: 'Default body copy used for paragraphs and lists.',
  },
  caption: {
    role: 'Caption',
    token: 'text-sm',
    className: 'font-body text-sm leading-[1.5] text-muted',
    description: 'Captions, metadata, and legal text.',
    sample: 'Caption or metadata text',
  },
} as const satisfies Record<string, TypographyRole>
