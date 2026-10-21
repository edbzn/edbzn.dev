---
title: 'State of Rspack in Angular: 2026 Update'
date: '2026-10-19'
description: Twenty months after the first article, a look at where Rspack in Angular stands today, what the Nx team shipped, what Angular changed on its side, and whether it is worth the switch.
tags: [angular, tooling]
---

![Rspack and Angular logo](./logo.png)

In January 2025 I wrote about the [State of Rspack in Angular](/blog/state-of-rspack-in-angular/). At that time Angular Rspack was a promising proof of concept living in Colum Ferry's personal GitHub account, with a long list of missing features and a big "not for production" warning.

A lot happened since then, on both sides. This post covers what changed, what is still missing, and my honest take on who should use it today.

## TL;DR

- Angular Rspack now lives in the **Nx monorepo** as [`@nx/angular-rspack`](https://www.npmjs.com/package/@nx/angular-rspack) and ships with every Nx release.
- Most of the gaps I listed are closed: **i18n, SSG, HMR, web workers, `define`, optimization parity**, and since Nx 23.3 the **`@angular/ssr` application engine**.
- It is **still flagged as experimental** by the Nx team.
- [Rspack 2.0](https://rspack.dev/blog/announcing-2-0) is out and supported.
- Angular **deprecated its Webpack builders in v22** and **fixed most of the chunking issues** I complained about, so the case for Rspack has shifted.

## Where Angular Rspack lives now

The project moved twice:

1. From [`Coly010/ng-rspack-build`](https://github.com/Coly010/ng-rspack-build) to [`nrwl/angular-rspack`](https://github.com/nrwl/angular-rspack), when Colum Ferry brought it to the Nx team.
2. Then into the [Nx monorepo](https://github.com/nrwl/nx/tree/master/packages/angular-rspack) itself. The standalone repository was archived on September 6, 2025.

The packages were renamed as well. `@ng-rspack/build` is now `@nx/angular-rspack`, and the compilation layer is published separately as `@nx/angular-rspack-compiler`. Both follow the Nx version scheme, so they get released with Nx, at the same cadence.

<Note>
You do not need an Nx workspace to use `@nx/angular-rspack`: it is a regular Rspack plugin that you can call from a plain `rspack.config.ts`. Nx only adds generators, inferred tasks and caching on top.
</Note>

Adoption is still modest. `@nx/angular-rspack` gets around **19k weekly downloads**, against **4.6M** for `@rspack/core`. Angular Rspack is a niche inside the Rspack ecosystem, but it is a maintained one.

## The limitations list, revisited

In the first post I listed what was missing. Here is the same list today, based on the [Nx docs](https://nx.dev/docs/technologies/angular/angular-rspack/introduction) and the Nx changelog:

| Feature                                  | January 2025 | Today                                                    |
|------------------------------------------|--------------|----------------------------------------------------------|
| Internationalization (i18n)              | ❌           | ✅ since 20.8                                            |
| Build-time prerendering (SSG)            | ❌           | ✅ since 20.9, with the `prerender` option               |
| HMR                                      | ❌           | ✅ since 21                                              |
| Web workers                              | ❌           | ✅ since 20.8                                            |
| Build-time value replacement (`define`)  | ❌           | ✅                                                       |
| Deferred views                           | ❌           | ✅ no longer listed as a limitation                      |
| App Engine APIs (`@angular/ssr`)         | ❌           | ✅ since Nx 23.3                                         |
| Hybrid rendering                         | ❌           | ⚠️ `outputMode: 'server'` only, `static` is not supported |
| Angular CLI builder                      | ❌           | ❌ you use the Rspack CLI or Nx inferred tasks            |

The App Engine support is the most recent piece. It [landed in September 2026](https://github.com/nrwl/nx/pull/36298) and shipped in Nx 23.3. It matters because Angular v22 deprecated `CommonEngine` in favor of `AngularNodeAppEngine`, which is what the Angular CLI scaffolds. Before that change, an SSR app generated with `--bundler=rspack` was still built on the deprecated API.

### What is still missing

The current list of known limitations is shorter, and much more specific:

- The `static` output mode, meaning a fully prerendered application, is not supported.
- `RenderMode.Prerender` in server routes does not produce build-time output, those routes render at request time. Use the `prerender` build option to list the routes to prerender instead.
- The server route configuration is extracted at runtime, not at build time, so route config errors only show up on the first request.
- Automatic CSP generation (`security.autoCsp`) is not supported.
- Locale inlining (`localize`) cannot be combined with `outputMode`.

These are edge cases compared to the list I had in 2025. If your app is client-side rendered, or uses SSR without full static output, you are covered.

<Note type="warning">
The Nx docs still say: "Angular Rspack support is still experimental and is not yet considered production ready." Read that before migrating a business-critical app, and pin your versions.
</Note>

## Rspack 2.0

Rspack itself kept moving. [Rspack 2.0](https://rspack.dev/blog/announcing-2-0) was released on April 22, 2026, alongside Rsbuild 2.0. The highlights:

- A **pure ESM core**, and much leaner dependencies: `@rspack/core` went from 8 dependencies to 1, `@rspack/dev-server` from 192 to 1.
- Around **10% faster than 1.7** overall, and up to 2× faster than 1.0.
- **Tree shaking of shared dependencies** in Module Federation.
- Better static analysis and new options like `splitChunks.enforceSizeThreshold`.

`@nx/angular-rspack` 23.3 supports `@rspack/core` `^2.0.0 || >=1.3.5 <1.7.0`, so you can go straight to 2.0, and Angular 20 to 22.

## Angular moved too

This is the part I did not see coming. When I wrote the first post, my main arguments for Rspack were the poor code-splitting of esbuild, Module Federation, and an escape hatch from a closed build pipeline. Angular addressed the first one itself.

### Webpack builders are deprecated

[Angular v22](https://github.com/angular/angular-cli/blob/main/CHANGELOG.md), released on June 3, 2026, deprecated the Webpack builders in `@angular-devkit/build-angular` and `@angular-devkit/build-webpack`, as well as the `@ngtools/webpack` loader and plugin. The recommendation is to move to the `@angular/build` builders.

If you are still on Webpack with a custom configuration, this is the signal you were waiting for. You now have two paths:

- Migrate to the **esbuild-based application builder** and drop your custom Webpack config.
- Migrate to **Rspack** and keep most of your Webpack config and plugins.

Angular Rspack was designed for the second path. It also uses the abstractions from Angular's esbuild pipeline rather than the Webpack one, so the deprecation does not affect it.

### Chunk optimization is now on by default

Remember the code-splitting issues with esbuild? Angular v22 **enables chunk optimization by default**, using heuristics to merge the small chunks that esbuild produces. In v22.1, released on July 29, 2026, the chunk optimizer **switched to Rolldown by default** and was **enabled for server builds** too.

This does not give you the fine-grained control of `splitChunks`, but it takes care of the "hundreds of tiny chunks" problem for most applications. Control over chunking is no longer a strong reason on its own to move to Rspack.

### The official stance did not change

The Angular team has been clear about it since 2024:

> We do not plan to add first-party support for Rspack in the near future, as we currently believe that Vite and Esbuild are better suited to our needs. — [Alan Agius](https://github.com/angular/angular-cli/issues/27981)

That has not changed. Angular Rspack remains a community and Nx effort, and the Angular CLI keeps going in the esbuild, Vite and now Rolldown direction.

## Benchmarks, corrected

In the first post I shared a benchmark where Rspack beat esbuild. The Nx team later re-ran the [benchmark](https://github.com/nrwl/ng-bundler-benchmark) on an app with ~800 lazy routes and ~8000 components, and the numbers they publish today tell a different story:

| Bundler    | Prod SSR (s) | Prod (s) | Dev (s) |
|------------|--------------|----------|---------|
| 🐌 Webpack | 198.614      | 154.339  | 159.436 |
| esbuild    | 23.701       | 19.569   | 15.358  |
| Rspack     | 30.589       | 19.269   | 19.940  |

Rspack is **about 8× faster than Webpack**, and roughly on par with esbuild, slower on SSR and dev builds. These numbers were measured with Rspack 1.x, so 2.0 should narrow the gap a bit, but do not move to Rspack expecting faster builds than the Angular CLI.

The win is against Webpack, not against esbuild.

## Getting started today

### New application

With Nx, the Angular application generator has a `--bundler` option:

```bash
npx nx g @nx/angular:app apps/demo --bundler=rspack
```

Add `--ssr` to generate a server-rendered app, scaffolded on the `@angular/ssr` application engine.

### Migrating from Webpack

For an existing Angular CLI app using Webpack, initialize Nx and run the conversion generator:

```bash
npx nx@latest init
npx nx g convert-to-rspack
```

It removes the `build` and `serve` targets from your project, generates an `rspack.config.ts`, and registers the `@nx/rspack/plugin` that infers the tasks.

### Configuration

The configuration has changed since 2025. `createConfig` now takes the default options first, then one entry per configuration, just like `angular.json`:

```ts
// rspack.config.ts

import { createConfig } from '@nx/angular-rspack';

export default createConfig(
  {
    options: {
      root: __dirname,
      outputPath: { base: '../../dist/apps/demo' },
      index: './src/index.html',
      browser: './src/main.ts',
      server: './src/main.server.ts',
      ssr: { entry: './src/server.ts' },
      tsConfig: './tsconfig.app.json',
      assets: [{ input: './public', glob: '**/*' }],
      styles: ['./src/styles.css'],
    },
  },
  {
    development: {
      options: {
        optimization: false,
        namedChunks: true,
      },
    },
  }
);
```

The configuration is picked with the `NGRS_CONFIG` environment variable, and defaults to `production`:

```bash
NGRS_CONFIG=development nx build demo
```

Most option names match the Angular application builder, so migrating from `angular.json` is mostly copy and paste.

### Module Federation

Module Federation was one of my main reasons to look at Rspack, and it works. Use `rspackConfigOverrides` to plug the official `@module-federation/enhanced` plugin into the generated config:

```js
// rspack.config.js

const { ModuleFederationPlugin } = require('@module-federation/enhanced/rspack');
const { createConfig } = require('@nx/angular-rspack');
const mfConfig = require('./module-federation.config');

module.exports = createConfig({
  options: {
    root: __dirname,
    index: './src/index.html',
    browser: './src/main.ts',
    tsConfig: './tsconfig.app.json',
  },
  rspackConfigOverrides: {
    output: { uniqueName: mfConfig.name, publicPath: 'auto' },
    plugins: [new ModuleFederationPlugin(mfConfig)],
  },
});
```

See the [host and remote example](https://github.com/nrwl/nx/tree/master/examples/angular-rspack/module-federation) in the Nx repository for a complete setup.

<Note>
`rspackConfigOverrides` is also your escape hatch for anything else: custom loaders, Webpack plugins, or your own `splitChunks` strategy.
</Note>

## So, should you use it?

My take, as of today:

- **You are on Webpack with a custom config or Module Federation**: yes, look at it seriously. Your builders are deprecated, and Rspack lets you keep your plugins while getting a large speed-up. Test it carefully, it is still experimental.
- **You are on the esbuild application builder and happy with it**: no. You will not get faster builds, and Angular now handles chunk optimization for you.
- **You need a build you can extend**: Rspack is still the only way to get a real plugin system with Angular, other than writing esbuild plugins through third-party builders.
- **You need full static output (`outputMode: 'static'`) or `autoCsp`**: not yet.

Rspack did not become the default way to build Angular apps, and the direction of the Angular CLI makes that unlikely. But it found its place: a fast, maintained way off Webpack for apps that rely on custom build configuration or Module Federation. Now that the Webpack builders are deprecated, that is a lot of apps.

**Thanks again to [Colum Ferry](https://x.com/FerryColum) and the Nx team for carrying this project from a POC to where it is today.**

## References

- [Angular Rspack documentation](https://nx.dev/docs/technologies/angular/angular-rspack/introduction) by Nx
- [Migrate Angular with Webpack to Rspack](https://nx.dev/docs/kb/migrate-from-webpack) by Nx
- [Using Rspack with Angular](https://nx.dev/blog/using-rspack-with-angular) and [Scaffolding New Apps With Angular Rspack](https://nx.dev/blog/scaffold-angular-rspack-applications) by Colum Ferry
- [Announcing Rspack 2.0](https://rspack.dev/blog/announcing-2-0) by the Rspack team
- [Angular CLI changelog](https://github.com/angular/angular-cli/blob/main/CHANGELOG.md)
- [ng-bundler-benchmark](https://github.com/nrwl/ng-bundler-benchmark)
