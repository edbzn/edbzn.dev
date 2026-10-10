/**
 * Everything listed on /uses, grouped by category.
 *
 * Item shape: { name, url?, description?, tags?, monogram? }
 *   - `tags` are short labels used by the search box on /uses.
 *   - `monogram` overrides the 1–2 letter badge derived from `name`.
 *
 * Category shape: { id, title, hue, items }
 *   - `hue` (0–360) tints the monograms and chips of that category.
 */
export const usesCategories = [
  {
    id: 'editor',
    title: 'Editor',
    hue: 212,
    items: [
      {
        name: 'VS Code',
        url: 'https://code.visualstudio.com',
        description: 'My daily driver for everything',
        monogram: 'VS',
      },
      {
        name: 'Vim',
        url: 'https://www.vim.org',
        description: 'For quick edits in the terminal',
        tags: ['terminal'],
      },
      {
        name: 'Abyss theme',
        description: "The deep navy that inspired this website's third theme",
        tags: ['theme', 'this site'],
      },
      {
        name: 'JetBrains Mono',
        url: 'https://www.jetbrains.com/lp/mono',
        description: 'Programming font with ligatures (+ Nerd Font variant)',
        tags: ['font'],
      },
    ],
  },
  {
    id: 'terminal',
    title: 'Terminal & Shell',
    hue: 140,
    items: [
      {
        name: 'Warp',
        url: 'https://www.warp.dev',
        description: 'Modern terminal with AI-powered features',
        tags: ['AI'],
      },
      {
        name: 'Terminator',
        url: 'https://gnome-terminator.org',
        description: 'Terminal emulator with multiple panes',
      },
      {
        name: 'Zsh + Oh My Zsh',
        url: 'https://ohmyz.sh',
        description: 'Enhanced shell with plugins and completions',
        tags: ['zsh'],
      },
      {
        name: 'Powerlevel10k',
        url: 'https://github.com/romkatv/powerlevel10k',
        description: 'Fast and customizable Zsh prompt theme',
        tags: ['zsh', 'prompt'],
        monogram: 'P10',
      },
      {
        name: 'zsh-syntax-highlighting',
        description: 'Syntax highlighting for Zsh commands',
        tags: ['zsh', 'plugin'],
        monogram: 'SH',
      },
      {
        name: 'zsh-autosuggestions',
        description: 'Fish-like autosuggestions for Zsh',
        tags: ['zsh', 'plugin'],
        monogram: 'AS',
      },
    ],
  },
  {
    id: 'cli',
    title: 'CLI Tools',
    hue: 38,
    items: [
      {
        name: 'lsd',
        url: 'https://github.com/lsd-rs/lsd',
        description: 'Modern ls with colors and icons',
        tags: ['files'],
      },
      {
        name: 'bat',
        url: 'https://github.com/sharkdp/bat',
        description: 'cat with syntax highlighting',
        tags: ['files'],
      },
      {
        name: 'ripgrep',
        url: 'https://github.com/BurntSushi/ripgrep',
        description: 'Blazingly fast grep that respects .gitignore',
        tags: ['search'],
        monogram: 'rg',
      },
      {
        name: 'fd',
        url: 'https://github.com/sharkdp/fd',
        description: 'Simple, fast find alternative',
        tags: ['search', 'files'],
      },
      {
        name: 'fzf',
        url: 'https://github.com/junegunn/fzf',
        description: 'Fuzzy finder for everything',
        tags: ['search'],
      },
      {
        name: 'zoxide',
        url: 'https://github.com/ajeetdsouza/zoxide',
        description: 'Smarter cd that learns your habits',
        tags: ['navigation'],
        monogram: 'z',
      },
      {
        name: 'delta',
        url: 'https://github.com/dandavison/delta',
        description: 'Syntax-highlighting pager for git diffs',
        tags: ['git'],
        monogram: 'Δ',
      },
      {
        name: 'jq',
        url: 'https://jqlang.github.io/jq',
        description: 'Lightweight command-line JSON processor',
        tags: ['JSON'],
      },
      {
        name: 'htop / btop',
        description: 'Interactive process viewers and resource monitors',
        tags: ['monitoring'],
        monogram: 'ht',
      },
      {
        name: 'GitHub CLI',
        url: 'https://cli.github.com',
        description: 'GitHub operations from the command line',
        tags: ['git'],
        monogram: 'gh',
      },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Frameworks',
    hue: 278,
    items: [
      {
        name: 'Angular',
        url: 'https://angular.dev',
      },
      {
        name: 'React',
        url: 'https://react.dev',
      },
      {
        name: 'Vue.js',
        url: 'https://vuejs.org',
        monogram: 'V',
      },
      {
        name: 'Qwik',
        url: 'https://qwik.dev',
      },
      {
        name: 'Gatsby',
        url: 'https://www.gatsbyjs.com',
        description: 'Powers this website',
        tags: ['this site'],
      },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    hue: 345,
    items: [
      {
        name: 'NestJS',
        url: 'https://nestjs.com',
        description: 'Progressive Node.js framework for server-side apps',
        tags: ['Node.js'],
      },
      {
        name: 'Serverless Framework',
        url: 'https://www.serverless.com',
        description: 'Build and deploy serverless applications',
        tags: ['serverless'],
        monogram: 'SLS',
      },
    ],
  },
  {
    id: 'languages',
    title: 'Languages & Tools',
    hue: 188,
    items: [
      {
        name: 'TypeScript',
        url: 'https://www.typescriptlang.org',
        description: 'Primary language for everything',
        tags: ['language'],
        monogram: 'TS',
      },
      {
        name: 'Python',
        url: 'https://python.org',
        tags: ['language'],
      },
      {
        name: 'Rust + Cargo',
        url: 'https://www.rust-lang.org',
        description: 'Systems programming language',
        tags: ['language'],
        monogram: 'Rs',
      },
      {
        name: 'Node.js',
        url: 'https://nodejs.org',
        description: 'Managed with n for version switching',
        tags: ['runtime', 'Node.js'],
        monogram: 'N',
      },
      {
        name: 'Bun',
        url: 'https://bun.sh',
        description: 'Fast all-in-one JavaScript runtime & toolkit',
        tags: ['runtime'],
      },
      {
        name: 'pnpm',
        url: 'https://pnpm.io',
        description: 'Fast, disk space efficient package manager',
        tags: ['package manager'],
        monogram: 'pn',
      },
      {
        name: 'Nx',
        url: 'https://nx.dev',
        description: 'Smart monorepo build system',
        tags: ['monorepo'],
      },
      {
        name: 'Docker + Docker Compose',
        url: 'https://docker.com',
        description: 'Container platform for applications',
        tags: ['containers'],
      },
      {
        name: 'Git',
        description: 'With conventional commits and signed tags',
        tags: ['git'],
      },
      {
        name: 'Bruno',
        url: 'https://www.usebruno.com',
        description: 'Open-source API client alternative to Postman',
        tags: ['API'],
      },
      {
        name: 'Jest',
        url: 'https://jestjs.io',
        description: 'JavaScript testing framework',
        tags: ['testing'],
      },
      {
        name: 'Vitest',
        url: 'https://vitest.dev',
        description: 'Vite-native unit test framework',
        tags: ['testing'],
        monogram: 'Vt',
      },
      {
        name: 'Cypress',
        url: 'https://www.cypress.io',
        description: 'E2E and component testing',
        tags: ['testing', 'E2E'],
        monogram: 'Cy',
      },
      {
        name: 'Playwright',
        url: 'https://playwright.dev',
        description: 'Cross-browser end-to-end testing',
        tags: ['testing', 'E2E'],
        monogram: 'Pw',
      },
      {
        name: 'k6',
        url: 'https://k6.io',
        description: 'Modern load testing tool by Grafana',
        tags: ['testing'],
      },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure & Cloud',
    hue: 18,
    items: [
      {
        name: 'Terraform',
        url: 'https://www.terraform.io',
        description: 'Infrastructure as Code',
        tags: ['IaC'],
      },
      {
        name: 'AWS',
        url: 'https://aws.amazon.com',
        description: 'Lambda, S3, CloudFront, and more',
        tags: ['cloud'],
      },
      {
        name: 'Scaleway',
        url: 'https://www.scaleway.com',
        description: 'European cloud provider',
        tags: ['cloud'],
      },
      {
        name: 'ngrok',
        url: 'https://ngrok.com',
        description: 'Secure tunnels to localhost',
      },
      {
        name: 'Kubernetes',
        url: 'https://kubernetes.io',
        description: 'Container orchestration',
        tags: ['cloud', 'containers'],
        monogram: 'K8s',
      },
      {
        name: 'Ansible',
        url: 'https://www.ansible.com',
        description: 'Provisioning my dev environment via dotfiles',
        tags: ['dotfiles'],
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI',
    hue: 255,
    items: [
      {
        name: 'GitHub Copilot',
        url: 'https://github.com/features/copilot',
        description: 'AI pair programmer',
        tags: ['AI'],
      },
      {
        name: 'Claude CLI + Desktop',
        url: 'https://claude.ai',
        description: 'Anthropic Claude AI assistant',
        tags: ['AI'],
        monogram: 'Cl',
      },
      {
        name: 'ChatGPT Desktop',
        url: 'https://chat.openai.com',
        description: 'OpenAI ChatGPT desktop application',
        tags: ['AI'],
        monogram: 'GPT',
      },
    ],
  },
  {
    id: 'services',
    title: 'Services',
    hue: 165,
    items: [
      {
        name: 'GitHub',
        url: 'https://github.com',
        description: 'Code hosting, CI/CD, and project management',
        tags: ['git', 'CI/CD'],
        monogram: 'GH',
      },
      {
        name: 'Cloudflare',
        url: 'https://cloudflare.com',
        description: 'Workers, KV, and DNS',
        tags: ['cloud'],
        monogram: 'CF',
      },
      {
        name: 'New Relic',
        url: 'https://newrelic.com',
        description: 'Observability and monitoring',
        tags: ['monitoring'],
      },
      {
        name: 'MongoDB Compass + mongosh',
        url: 'https://www.mongodb.com/products/compass',
        description: 'GUI and CLI for MongoDB',
        tags: ['database'],
        monogram: 'MDB',
      },
    ],
  },
  {
    id: 'os',
    title: 'Operating System & Desktop',
    hue: 305,
    items: [
      {
        name: 'Linux',
        description: 'Primary OS for development',
      },
      {
        name: 'GNOME',
        description: 'Desktop environment with gnome-tweaks',
        tags: ['desktop'],
      },
      {
        name: 'GNU Stow',
        url: 'https://www.gnu.org/software/stow',
        description: 'Symlink farm manager for dotfiles',
        tags: ['dotfiles'],
      },
      {
        name: 'Flameshot',
        url: 'https://flameshot.org',
        description: 'Powerful screenshot tool',
      },
      {
        name: 'Google Chrome',
        description: 'Primary browser for development',
        tags: ['browser'],
      },
    ],
  },
  {
    id: 'media',
    title: 'Media & Communication',
    hue: 62,
    items: [
      {
        name: 'OBS Studio',
        url: 'https://obsproject.com',
        description: 'Live streaming and screen recording',
        tags: ['video'],
      },
      {
        name: 'Kdenlive',
        url: 'https://kdenlive.org',
        description: 'Video editing',
        tags: ['video'],
        monogram: 'Kd',
      },
      {
        name: 'GIMP',
        url: 'https://www.gimp.org',
        description: 'Image editing',
      },
      {
        name: 'Slack',
        url: 'https://slack.com',
        tags: ['chat'],
      },
      {
        name: 'Discord',
        url: 'https://discord.com',
        tags: ['chat'],
      },
      {
        name: 'Spotify',
        url: 'https://spotify.com',
        description: 'Music while coding',
      },
    ],
  },
];

/**
 * Where the AI tools above (the AI category, plus Warp from Terminal & Shell)
 * show up in my setup. `name` must match an item
 * name in `usesCategories`; `surfaces` are ids from `aiSurfaces`.
 */
export const aiSurfaces = [
  { id: 'editor', label: 'Editor' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'desktop', label: 'Desktop' },
];

export const aiTools = [
  { name: 'GitHub Copilot', surfaces: ['editor'] },
  { name: 'Warp', surfaces: ['terminal'] },
  { name: 'Claude CLI + Desktop', surfaces: ['terminal', 'desktop'] },
  { name: 'ChatGPT Desktop', surfaces: ['desktop'] },
];
