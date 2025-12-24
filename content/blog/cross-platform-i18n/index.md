---
title: Cross-framework internationalization with Angular localize
draft: true
description: How to use @angular/localize across different frameworks for consistent internationalization in large monorepos.
tags: [i18n, angular, vite, webpack, nx, monorepo]
---

Recently, I worked on [Rosa](https://rosa.be)’s internationalization (i18n) system, and wanted to share what I learned along the way.

Many tools offer i18n support, but maintaining consistency in large monorepos is essential. At Rosa, we standardized on Angular’s official `@angular/localize` tooling and use it everywhere, regardless of the **framework**.

**Why a unified approach matters**: In large monorepos with dozens of apps and libraries, ad-hoc i18n quickly becomes unmaintainable. Standardizing gives:

- **One API** (`$localize`)
- **One transformation engine** (Angular’s Babel plugins)
- **One extraction pattern**
- **One key format** for type safety and validation

## What is Angular localize?

The package provides i18n support using a `$localize` tagged template literal. It marks strings in your code that need translation:

```ts
const message = $localize`Hello, World!`;
```

### Processing scenarios

1. **Build-time (prod)**: Translations are inlined during the build process, producing separate bundles per locale.

```ts
// Source code
const message = $localize`${this.process} is not right`;

// After build-time translation (for French)
const message = '' + this.process + ", n'est pas bon. ";
```

<Note>Build-time translation brings runtime performance benefits by inlining translations and avoiding runtime overhead.</Note>

2. **Runtime**: Translations are loaded and evaluated at runtime, allowing language switching.

```ts
import '@angular/localize/init'; // Side-effect: attaches $localize to globalThis
import { loadTranslations } from '@angular/localize';

loadTranslations({
  greeting: 'Bonjour le monde!',
});

// Outputs 'Bonjour le monde!'
const message = $localize`:greeting:Hello, World!`;
```

<Note>Translations are processed only once, meaning that language switches require a browser refresh.</Note>

3. **Pass-through (dev mode)**: No translation loaded; `$localize` simply evaluates the original template string. This is what happens in development mode by default.

Now that we understand the basics, let's see how to integrate Angular localize with another framework.

## Angular's localize tools for any framework

Before diving into the integration, it's important to note that Angular's i18n tooling is **framework-agnostic** at its core. The transformation logic is encapsulated in Babel plugins provided by `@angular/localize/tools`.

When you write:

```tsx
const title = $localize`:@@welcome.title:Welcome to React`;
```

The transformation process follows this architecture:

```mermaid
graph TD
    A[localize-translate CLI] -->|High-level CLI tool| B[translateFiles function]
    B -->|Orchestration function| C[SourceFileTranslationHandler]
    C -->|File processor| D[Babel transformation]
    D --> E[makeEs2015TranslatePlugin]
    D --> F[makeEs5TranslatePlugin]
    D --> G[makeLocalePlugin]

    style A fill:#e1f5ff
    style B fill:#fff4e6
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#fff9c4
    style F fill:#fff9c4
    style G fill:#fff9c4
```

1. **`localize-translate` CLI** <br/>
   Entry point for developers and Angular CLI. It parses arguments, loads translation files (XLF, JSON, etc.), resolves source files via globs, and triggers the translation process.

2. **`translateFiles()`** <br/>
   Orchestrates the workflow by selecting the right parsers, creating a `Translator` per locale, running translations in parallel, and collecting diagnostics.

3. **`SourceFileTranslationHandler`** <br/>
   Handles each source file individually: reads it from disk, parses it into an AST, applies locale-specific transformations, and writes the translated output to the correct directory.

4. **Babel transformation (core logic)** <br/>
   Translation happens via three Babel plugins:
   - **`makeLocalePlugin`** replaces `$localize.locale` with the concrete locale (e.g. `"fr-FR"`).
   - **`makeEs2015TranslatePlugin`** transforms `$localize` tagged templates into translated strings for modern JS syntax.
   - **`makeEs5TranslatePlugin`** handles the ES5 `$localize([...])` form emitted by downleveled TypeScript.

<Note type="tip">The beauty of this architecture is that **the same low-level Babel plugins** can be used in any build tool (Webpack, Vite, Rollup, Esbuild) to achieve consistent i18n transformations across frameworks.</Note>

## Integrating with Vite

Creating a Vite plugin is straightforward - it's just a matter of wiring Angular's Babel plugins into Vite's transform pipeline. Let's build it step by step.

### Plugin configuration

First, define the plugin options to make it flexible and reusable:

```ts
import type { Plugin } from 'vite';

export interface LocalizePluginOptions {
  translations?: string | Record<string, any>;
  locale?: string;
  missingTranslation?: 'error' | 'warning' | 'ignore';
  localizeName?: string;
  sourceMaps?: boolean;
}
```

This allows consumers to either provide a path to a translation file or pass translations directly as an object.

### Loading translation files

Angular's `SimpleJsonTranslationParser` handles the heavy lifting of parsing translation files with proper validation:

```ts
import { SimpleJsonTranslationParser } from '@angular/localize/tools';
import * as fs from 'fs';

function loadTranslations(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parser = new SimpleJsonTranslationParser();

  // First analyze to check if the file is parseable
  const analysis = parser.analyze(filePath, content);
  if (!analysis.canParse) {
    throw new Error(
      analysis.diagnostics.formatDiagnostics(`Cannot parse ${filePath}`)
    );
  }

  // Then parse using the analysis hint
  const parsedFile = parser.parse(filePath, content, analysis.hint);
  if (parsedFile.diagnostics.hasErrors) {
    throw new Error(
      parsedFile.diagnostics.formatDiagnostics(`Failed to parse ${filePath}`)
    );
  }

  return {
    locale: parsedFile.locale || 'en',
    translations: parsedFile.translations,
  };
}
```

This two-step process ensures we catch parsing errors early with clear diagnostic messages.

### The plugin implementation

Now we can wire everything together into a Vite plugin:

```ts
import { transformAsync } from '@babel/core';
import {
  makeEs2015TranslatePlugin,
  makeEs5TranslatePlugin,
  makeLocalePlugin,
  Diagnostics,
} from '@angular/localize/tools';
import * as path from 'path';

export function angularLocalize(options: LocalizePluginOptions = {}): Plugin {
  const {
    translations = {},
    locale = 'en',
    missingTranslation = 'warning',
    localizeName = '$localize',
    sourceMaps = true,
  } = options;

  let translationsMap: Record<string, any> = {};
  let resolvedLocale = locale;

  return {
    name: 'vite-plugin-angular-localize',
    enforce: 'post', // Run after other transforms

    configResolved(config) {
      // Load translations once during config resolution
      if (typeof translations === 'string') {
        const file = loadTranslations(path.resolve(config.root, translations));
        translationsMap = file.translations;
        resolvedLocale = file.locale;
      } else {
        translationsMap = translations;
      }
    },

    async transform(code, id) {
      // Performance: skip files without $localize
      if (!code.includes(localizeName)) return null;

      // Skip node_modules except @angular/localize runtime
      if (id.includes('node_modules') && !id.includes('@angular/localize')) {
        return null;
      }

      const diagnostics = new Diagnostics();

      const result = await transformAsync(code, {
        filename: id,
        sourceMaps,
        compact: false,
        plugins: [
          makeLocalePlugin(resolvedLocale, { localizeName }),
          makeEs2015TranslatePlugin(diagnostics, translationsMap, {
            missingTranslation,
            localizeName,
          }),
          makeEs5TranslatePlugin(diagnostics, translationsMap, {
            missingTranslation,
            localizeName,
          }),
        ],
      });

      // Surface translation errors and warnings
      if (diagnostics.hasErrors) {
        this.error(diagnostics.formatDiagnostics(`Translation errors in ${id}`));
      } else if (diagnostics.messages.length > 0) {
        diagnostics.messages.forEach((msg) => {
          if (msg.type === 'warning') {
            this.warn(`${id}: ${msg.message}`);
          }
        });
      }

      return result ? { code: result.code, map: result.map } : null;
    },
  };
}
```

**Key aspects:**
- **`plugins`** array applies the three Angular Babel plugins
- **`enforce: 'post'`** ensures the plugin runs after TypeScript/JSX transforms
- **`configResolved`** loads translations once at startup for performance

### Usage

With the plugin ready, integrate it into your Vite config. Here's a real-world setup that handles both development and production builds:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { angularLocalize } from './path/to/plugin';

// Use LOCALE env var for production builds (e.g., LOCALE=fr npm run build)
// In dev, serve a single build and handle locale routing in the app
const locale = process.env.LOCALE || 'en';

export default defineConfig(({ mode }) => {
  const isDevMode = mode === 'development';

  return {
    // In dev: base is '/' (routing handles /en, /fr paths)
    // In prod: base is '/{locale}/' (separate builds per locale)
    base: isDevMode ? '/' : `/${locale}/`,

    plugins: [
      react(),
      angularLocalize({
        translations: `./src/i18n/${locale}.json`,
        locale: locale,
        missingTranslation: 'warning',
      }),
    ],

    build: {
      // Each locale builds to its own directory
      outDir: `./dist/${locale}`,
    },
  };
});
```

**Development workflow:**
```bash
nx serve react-app  # Single build, serves at http://localhost:4200
                    # App routing handles /en, /fr, etc.
```

**Production builds with Nx:**

In your `project.json`, define separate build targets per locale:

```json
{
  "targets": {
    "build:en": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/react-app/en"
      }
    },
    "build:fr": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/react-app/fr"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "LOCALE=en nx build:en react-app",
          "LOCALE=fr nx build:fr react-app"
        ],
        "parallel": false
      }
    }
  }
}
```

Then build all locales at once:

```bash
nx build react-app  # → dist/apps/react-app/en/
                    # → dist/apps/react-app/fr/
```

Or build individual locales:

```bash
LOCALE=en nx build:en react-app  # → dist/apps/react-app/en/
LOCALE=fr nx build:fr react-app  # → dist/apps/react-app/fr/
```

## Supporting ICU Message Format

One challenge with `@angular/localize` is that it doesn't support ICU expressions (plurals, select, selectordinal) at compile time. The Angular CLI traditionally requires pre-compiled ICU messages in translation files.

However, for development workflows, we can add runtime ICU evaluation support by creating a custom Babel plugin that transforms ICU expressions into runtime calls:

```ts
function makeICURuntimePlugin(locale: string, localizeName: string) {
  return function ({ types: t }: any) {
    return {
      visitor: {
        TaggedTemplateExpression(path: any) {
          const tag = path.get('tag');
          if (tag.isIdentifier({ name: localizeName })) {
            const quasi = path.node.quasi;

            // Check if template contains ICU syntax
            const hasICU = quasi.quasis.some((q: any) =>
              /[:,]\s*(plural|select|selectordinal)/i.test(q.value.raw)
            );

            if (hasICU) {
              // Extract message ID and build ICU message
              const firstPart = quasi.quasis[0].value.raw;
              const idMatch = firstPart.match(/:@@([^:]+):/);
              const messageId = idMatch ? idMatch[1] : '';

              // Build expression map from template
              const expressionMap: any[] = [];
              let messageStr = '';

              quasi.quasis.forEach((element: any, i: number) => {
                let raw = element.value.raw;
                if (i === 0) {
                  raw = raw.replace(/^:@@[^:]+:/, '');
                }

                if (i < quasi.expressions.length) {
                  const expr = quasi.expressions[i];
                  const nextRaw = quasi.quasis[i + 1]?.value.raw || '';
                  const placeholderMatch = nextRaw.match(/^:([^:,}]+):/);
                  const placeholderName = placeholderMatch
                    ? placeholderMatch[1].trim()
                    : `expr_${i}`;

                  expressionMap.push({ name: placeholderName, expr });
                  messageStr += raw + placeholderName;
                } else {
                  messageStr += raw;
                }
              });

              // Replace with runtime call: $localize._icu(id, message, locale, values)
              const valuesObj = t.objectExpression(
                expressionMap.map((item: any) =>
                  t.objectProperty(t.stringLiteral(item.name), item.expr)
                )
              );

              const runtimeCall = t.callExpression(
                t.memberExpression(
                  t.identifier(localizeName),
                  t.identifier('_icu')
                ),
                [
                  t.stringLiteral(messageId),
                  t.stringLiteral(messageStr),
                  t.stringLiteral(locale),
                  valuesObj,
                ]
              );

              path.replaceWith(runtimeCall);
            }
          }
        },
      },
    };
  };
}
```

This plugin transforms ICU expressions like:

```ts
$localize`:@@item.count:You have ${count}:INTERPOLATION:, plural, =0 {no items} =1 {one item} other {# items}`
```

Into runtime calls:

```ts
$localize._icu('item.count', 'You have INTERPOLATION, plural, =0 {no items} =1 {one item} other {# items}', 'en', { INTERPOLATION: count })
```

You can then implement `$localize._icu` using libraries like [`intl-messageformat`](https://formatjs.io/docs/intl-messageformat/) to evaluate ICU expressions at runtime during development, while still using compile-time translation in production builds.


## Demo




