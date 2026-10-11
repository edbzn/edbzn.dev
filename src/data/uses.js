/**
 * Everything listed on /uses, grouped by category.
 *
 * Item shape: { name, url?, description? }
 * Category shape: { id, title, items }
 */
export const usesCategories = [
  {
    id: 'editor',
    title: 'Editor',
    items: [
      {
        name: 'VS Code',
        url: 'https://code.visualstudio.com',
        description: 'My daily driver for everything',
      },
      {
        name: 'Vim',
        url: 'https://www.vim.org',
        description: 'For quick edits in the terminal',
      },
      {
        name: 'Abyss theme',
        description: "The deep navy that inspired this website's third theme",
      },
      {
        name: 'JetBrains Mono',
        url: 'https://www.jetbrains.com/lp/mono',
        description: 'Programming font with ligatures (+ Nerd Font variant)',
      },
    ],
  },
  {
    id: 'terminal',
    title: 'Terminal & Shell',
    items: [
      {
        name: 'Warp',
        url: 'https://www.warp.dev',
        description: 'Modern terminal with AI-powered features',
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
      },
      {
        name: 'Powerlevel10k',
        url: 'https://github.com/romkatv/powerlevel10k',
        description: 'Fast and customizable Zsh prompt theme',
      },
      {
        name: 'zsh-syntax-highlighting',
        description: 'Syntax highlighting for Zsh commands',
      },
      {
        name: 'zsh-autosuggestions',
        description: 'Fish-like autosuggestions for Zsh',
      },
    ],
  },
  {
    id: 'cli',
    title: 'CLI Tools',
    items: [
      {
        name: 'lsd',
        url: 'https://github.com/lsd-rs/lsd',
        description: 'Modern ls with colors and icons',
      },
      {
        name: 'bat',
        url: 'https://github.com/sharkdp/bat',
        description: 'cat with syntax highlighting',
      },
      {
        name: 'ripgrep',
        url: 'https://github.com/BurntSushi/ripgrep',
        description: 'Blazingly fast grep that respects .gitignore',
      },
      {
        name: 'fd',
        url: 'https://github.com/sharkdp/fd',
        description: 'Simple, fast find alternative',
      },
      {
        name: 'fzf',
        url: 'https://github.com/junegunn/fzf',
        description: 'Fuzzy finder for everything',
      },
      {
        name: 'zoxide',
        url: 'https://github.com/ajeetdsouza/zoxide',
        description: 'Smarter cd that learns your habits',
      },
      {
        name: 'delta',
        url: 'https://github.com/dandavison/delta',
        description: 'Syntax-highlighting pager for git diffs',
      },
      {
        name: 'jq',
        url: 'https://jqlang.github.io/jq',
        description: 'Lightweight command-line JSON processor',
      },
      {
        name: 'htop / btop',
        description: 'Interactive process viewers and resource monitors',
      },
      {
        name: 'GitHub CLI',
        url: 'https://cli.github.com',
        description: 'GitHub operations from the command line',
      },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Frameworks',
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
      },
      {
        name: 'Qwik',
        url: 'https://qwik.dev',
      },
      {
        name: 'Gatsby',
        url: 'https://www.gatsbyjs.com',
        description: 'Powers this website',
      },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    items: [
      {
        name: 'NestJS',
        url: 'https://nestjs.com',
        description: 'Progressive Node.js framework for server-side apps',
      },
      {
        name: 'Serverless Framework',
        url: 'https://www.serverless.com',
        description: 'Build and deploy serverless applications',
      },
    ],
  },
  {
    id: 'languages',
    title: 'Languages & Tools',
    items: [
      {
        name: 'TypeScript',
        url: 'https://www.typescriptlang.org',
        description: 'Primary language for everything',
      },
      {
        name: 'Python',
        url: 'https://python.org',
      },
      {
        name: 'Rust + Cargo',
        url: 'https://www.rust-lang.org',
        description: 'Systems programming language',
      },
      {
        name: 'Node.js',
        url: 'https://nodejs.org',
        description: 'Managed with n for version switching',
      },
      {
        name: 'Bun',
        url: 'https://bun.sh',
        description: 'Fast all-in-one JavaScript runtime & toolkit',
      },
      {
        name: 'pnpm',
        url: 'https://pnpm.io',
        description: 'Fast, disk space efficient package manager',
      },
      {
        name: 'Nx',
        url: 'https://nx.dev',
        description: 'Smart monorepo build system',
      },
      {
        name: 'Docker + Docker Compose',
        url: 'https://docker.com',
        description: 'Container platform for applications',
      },
      {
        name: 'Git',
        description: 'With conventional commits and signed tags',
      },
      {
        name: 'Bruno',
        url: 'https://www.usebruno.com',
        description: 'Open-source API client alternative to Postman',
      },
      {
        name: 'Jest',
        url: 'https://jestjs.io',
        description: 'JavaScript testing framework',
      },
      {
        name: 'Vitest',
        url: 'https://vitest.dev',
        description: 'Vite-native unit test framework',
      },
      {
        name: 'Cypress',
        url: 'https://www.cypress.io',
        description: 'E2E and component testing',
      },
      {
        name: 'Playwright',
        url: 'https://playwright.dev',
        description: 'Cross-browser end-to-end testing',
      },
      {
        name: 'k6',
        url: 'https://k6.io',
        description: 'Modern load testing tool by Grafana',
      },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure & Cloud',
    items: [
      {
        name: 'Terraform',
        url: 'https://www.terraform.io',
        description: 'Infrastructure as Code',
      },
      {
        name: 'AWS',
        url: 'https://aws.amazon.com',
        description: 'Lambda, S3, CloudFront, and more',
      },
      {
        name: 'Scaleway',
        url: 'https://www.scaleway.com',
        description: 'European cloud provider',
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
      },
      {
        name: 'Ansible',
        url: 'https://www.ansible.com',
        description: 'Provisioning my dev environment via dotfiles',
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI',
    items: [
      {
        name: 'GitHub Copilot',
        url: 'https://github.com/features/copilot',
        description: 'AI pair programmer',
      },
      {
        name: 'Claude CLI + Desktop',
        url: 'https://claude.ai',
        description: 'Anthropic Claude AI assistant',
      },
      {
        name: 'ChatGPT Desktop',
        url: 'https://chat.openai.com',
        description: 'OpenAI ChatGPT desktop application',
      },
    ],
  },
  {
    id: 'services',
    title: 'Services',
    items: [
      {
        name: 'GitHub',
        url: 'https://github.com',
        description: 'Code hosting, CI/CD, and project management',
      },
      {
        name: 'Cloudflare',
        url: 'https://cloudflare.com',
        description: 'Workers, KV, and DNS',
      },
      {
        name: 'New Relic',
        url: 'https://newrelic.com',
        description: 'Observability and monitoring',
      },
      {
        name: 'MongoDB Compass + mongosh',
        url: 'https://www.mongodb.com/products/compass',
        description: 'GUI and CLI for MongoDB',
      },
    ],
  },
  {
    id: 'os',
    title: 'Operating System & Desktop',
    items: [
      {
        name: 'Linux',
        description: 'Primary OS for development',
      },
      {
        name: 'GNOME',
        description: 'Desktop environment with gnome-tweaks',
      },
      {
        name: 'GNU Stow',
        url: 'https://www.gnu.org/software/stow',
        description: 'Symlink farm manager for dotfiles',
      },
      {
        name: 'Flameshot',
        url: 'https://flameshot.org',
        description: 'Powerful screenshot tool',
      },
      {
        name: 'Google Chrome',
        description: 'Primary browser for development',
      },
    ],
  },
  {
    id: 'media',
    title: 'Media & Communication',
    items: [
      {
        name: 'OBS Studio',
        url: 'https://obsproject.com',
        description: 'Live streaming and screen recording',
      },
      {
        name: 'Kdenlive',
        url: 'https://kdenlive.org',
        description: 'Video editing',
      },
      {
        name: 'GIMP',
        url: 'https://www.gimp.org',
        description: 'Image editing',
      },
      {
        name: 'Slack',
        url: 'https://slack.com',
      },
      {
        name: 'Discord',
        url: 'https://discord.com',
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
