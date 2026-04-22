/**
 * Ideas for upcoming posts. Readers can upvote without auth to help me
 * prioritize. Ids are stable and used as KV keys in the Worker — don't rename
 * them once published, or you'll reset the count.
 *
 * Id format: ^[a-z0-9][a-z0-9-]{0,63}$
 */
export const blogIdeas = [
  {
    id: 'nx-agents-deep-dive',
    title: 'Nx Agents deep dive',
    description: 'How task distribution actually works under the hood.',
  },
  {
    id: 'vitest-vs-jest-2026',
    title: 'Vitest vs Jest in 2026',
    description: 'A fresh benchmark and migration notes.',
  },
  {
    id: 'ts-project-references',
    title: 'TypeScript project references, properly',
    description: 'Incremental builds without foot-guns.',
  },
];
