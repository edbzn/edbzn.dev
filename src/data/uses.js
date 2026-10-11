/**
 * Everything listed on /uses, grouped by category.
 *
 * Item shape: { name, url?, description?, monogram? }
 *   - `monogram` overrides the 1–2 letter badge derived from `name`.
 *
 * Category shape: { id, title, hue, items }
 *   - `hue` (0–360) tints the monograms of that category.
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
    hue: 140,
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
        monogram: 'P10',
      },
      {
        name: 'zsh-syntax-highlighting',
        description: 'Syntax highlighting for Zsh commands',
        monogram: 'SH',
      },
      {
        name: 'zsh-autosuggestions',
        description: 'Fish-like autosuggestions for Zsh',
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
        monogram: 'rg',
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
        monogram: 'z',
      },
      {
        name: 'delta',
        url: 'https://github.com/dandavison/delta',
        description: 'Syntax-highlighting pager for git diffs',
        monogram: 'Δ',
      },
      {
        name: 'jq',
        url: 'https://jqlang.github.io/jq',
        description: 'Lightweight command-line JSON processor',
      },
      {
        name: 'htop / btop',
        description: 'Interactive process viewers and resource monitors',
        monogram: 'ht',
      },
      {
        name: 'GitHub CLI',
        url: 'https://cli.github.com',
        description: 'GitHub operations from the command line',
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
      },
      {
        name: 'Serverless Framework',
        url: 'https://www.serverless.com',
        description: 'Build and deploy serverless applications',
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
        monogram: 'TS',
      },
      {
        name: 'Python',
        url: 'https://python.org',
      },
      {
        name: 'Rust + Cargo',
        url: 'https://www.rust-lang.org',
        description: 'Systems programming language',
        monogram: 'Rs',
      },
      {
        name: 'Node.js',
        url: 'https://nodejs.org',
        description: 'Managed with n for version switching',
        monogram: 'N',
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
        monogram: 'pn',
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
        monogram: 'Vt',
      },
      {
        name: 'Cypress',
        url: 'https://www.cypress.io',
        description: 'E2E and component testing',
        monogram: 'Cy',
      },
      {
        name: 'Playwright',
        url: 'https://playwright.dev',
        description: 'Cross-browser end-to-end testing',
        monogram: 'Pw',
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
    hue: 18,
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
        monogram: 'K8s',
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
    hue: 255,
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
        monogram: 'Cl',
      },
      {
        name: 'ChatGPT Desktop',
        url: 'https://chat.openai.com',
        description: 'OpenAI ChatGPT desktop application',
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
        monogram: 'GH',
      },
      {
        name: 'Cloudflare',
        url: 'https://cloudflare.com',
        description: 'Workers, KV, and DNS',
        monogram: 'CF',
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
    hue: 62,
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
