import { graphql } from 'gatsby';
import React from 'react';
import Layout from '../components/layout';
import { Seo } from '../components/seo';
import { GitHubRepo } from '../components/github-repo';
import { rhythm } from '../utils/typography';

const sectionHeadingStyle = {
  marginBottom: rhythm(1),
  fontFamily: '"Public Sans", sans-serif',
  textTransform: 'uppercase',
  fontWeight: '100',
};

const categoryStyle = {
  fontFamily: '"Public Sans", sans-serif',
  fontWeight: '400',
  fontSize: '1rem',
  marginBottom: rhythm(0.5),
  color: 'var(--text-primary)',
};

const itemListStyle = {
  listStyle: 'none',
  margin: 0,
  marginBottom: rhythm(1.2),
  padding: 0,
};

const itemStyle = {
  marginBottom: rhythm(0.4),
  fontFamily: '"Public Sans", sans-serif',
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

const itemNameStyle = {
  color: 'var(--text-primary)',
  fontWeight: '400',
};

const linkStyle = {
  color: 'var(--link-color)',
  boxShadow: 'none',
  textDecoration: 'none',
};

function UsesItem({ name, url, description }) {
  return (
    <li style={itemStyle}>
      <span style={itemNameStyle}>
        {url ? (
          <a href={url} style={linkStyle}>
            {name}
          </a>
        ) : (
          name
        )}
      </span>
      {description && <> — {description}</>}
    </li>
  );
}

function UsesCategory({ title, items }) {
  return (
    <div>
      <h3 style={categoryStyle}>{title}</h3>
      <ul style={itemListStyle}>
        {items.map((item) => (
          <UsesItem key={item.name} {...item} />
        ))}
      </ul>
    </div>
  );
}

const uses = {
  editor: {
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
      {
        name: 'GitHub Copilot',
        url: 'https://github.com/features/copilot',
        description: 'AI pair programmer',
      },
    ],
  },
  terminal: {
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
  cliTools: {
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
  frontendFrameworks: {
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
  backend: {
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
  devTools: {
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
  infrastructure: {
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
        name: 'Ansible',
        url: 'https://www.ansible.com',
        description: 'Provisioning my dev environment via dotfiles',
      },
    ],
  },
  ai: {
    title: 'AI',
    items: [
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
  services: {
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
  os: {
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
  media: {
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
};

class UsesPage extends React.Component {
  render() {
    const { data } = this.props;
    const { siteMetadata } = data.site;
    const { author, github } = siteMetadata;

    return (
      <Layout location={this.props.location} author={author} github={github}>
        <section>
          <div style={sectionHeadingStyle}>Uses</div>
          <p
            style={{
              fontFamily: '"Public Sans", sans-serif',
              marginBottom: rhythm(1.5),
              color: 'var(--text-secondary)',
            }}
          >
            Tools, software, and hardware I use daily for development. Inspired
            by{' '}
            <a href="https://uses.tech" style={linkStyle}>
              uses.tech
            </a>
            .
          </p>

          {Object.values(uses).map((category) => (
            <UsesCategory
              key={category.title}
              title={category.title}
              items={category.items}
            />
          ))}

          <div>
            <h3 style={categoryStyle}>Dotfiles</h3>
            <p
              style={{
                fontFamily: '"Public Sans", sans-serif',
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginBottom: rhythm(0.8),
              }}
            >
              My entire dev environment is automated with Ansible and GNU Stow.
            </p>
            <GitHubRepo
              name="edbzn/dotfiles"
              description="My dev environment provisioning scripts."
            />
          </div>
        </section>
      </Layout>
    );
  }
}

export default UsesPage;

export const Head = ({ location }) => (
  <Seo
    title="Uses"
    description="Tools, software, and hardware I use daily for development."
    pathname={location.pathname}
  />
);

export const pageQuery = graphql`
  {
    site {
      siteMetadata {
        author
        github {
          repositoryUrl
          sponsorUrl
          commitSha
        }
      }
    }
  }
`;
