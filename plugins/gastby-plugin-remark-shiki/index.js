// @ts-check

import { getSingletonHighlighter } from 'shiki';
import { visit } from 'unist-util-visit';

const themeConfig = {
  light: 'dark-plus',
  dark: 'github-dark-default',
  abyss: 'aurora-x',
};

export default async function (
  { markdownAST },
  {
    langs = [
      'text',
      'vue',
      'angular-ts',
      'javascript',
      'typescript',
      'bash',
      'html',
      'json',
      'docker',
      'tsx',
      'yaml',
      'yml',
      'css',
      'scss',
      'shellscript',
      'bash',
    ],
  }
) {
  if (!markdownAST) {
    return markdownAST;
  }

  const themes = Object.values(themeConfig);
  const highlighter = await getSingletonHighlighter({ themes, langs });

  visit(markdownAST, 'code', (node) => {
    node.type = 'html';
    node.children = [];

    if (!node.lang) {
      node.value = `<pre class="shiki-unknown"><code>${node.value}</code></pre>`;
      return;
    }

    node.value = highlighter.codeToHtml(node.value, {
      lang: node.lang,
      themes: themeConfig,
      defaultColor: false,
    });
  });

  return markdownAST;
}
