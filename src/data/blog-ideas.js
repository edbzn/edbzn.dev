/**
 * Ideas for upcoming posts. Readers can upvote without auth to help me
 * prioritize. Ids are stable and used as KV keys in the Worker — don't rename
 * them once published, or you'll reset the count.
 *
 * Id format: ^[a-z0-9][a-z0-9-]{0,63}$
 */
export const blogIdeas = [
  {
    id: 'nx-dte-vs-ci-matrix',
    title: 'Nx DTE vs CI job matrix',
    description:
      'Nx Distributed Task Execution (DTE) vs a traditional CI job matrix with manual sharding: a comparison of developer experience, performance, and reliability.',
  },
  {
    id: 'monorepo-readiness-checklist',
    title: 'Are you ready for a monorepo?',
    description:
      'An opinionated checklist to help you decide whether a monorepo is the right choice for your organization, and how to prepare for the transition.',
  },
];
