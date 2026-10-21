---
title: Service worker runtime cache made easy
date: '2019-01-24T00:00:00.000Z'
tags: [javascript, performance]
description: Learn how to simplify service worker creation using sw-precache.
---

Service workers improve client-side performance but they are not easy to build. They bring complexity in the build pipeline and they have a huge impact on what's going on in the browser.

### How can we simplify the service worker creation ?

Simply by not creating them. Nowadays we're all using tools like Webpack that generates a bundle associated with a hash. This hash is recreated each time source code is changed.

```bash
Version: webpack 4.29.5
Time: 5435ms
Built at: 2019-03-03 17:06:12

app-admin.f749dac1d8ea877edf08.js       69.5 KiB    [emitted]
app-article.5b996e3b9cffbefbc618.js     115 KiB     [emitted]
app-error.892811b3974653ad852f.js       23.3 KiB    [emitted]
app-home.67b6eecbf2b49d55ed66.js        49.9 KiB    [emitted]
app-login.a7ac57a5bcc4588af0a1.js       22.7 KiB    [emitted]
```

Keep in mind that to precache resources in a service worker we need to hard-code their public path. So each time we're bundling a new version of our application we should update the service worker :

* point these new resources in pre-cache configuration using the public path
* increment the cache version to notify the browser to refresh the cache

### *sw-precache* to the rescue

Google created a library that exactly solve our problem. So let's get it.

```bash
$ npm i sw-precache --save-dev
```

Then we can create a configuration file.

```javascript
module.exports = {
  staticFileGlobs: ['dist/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/codamit\/.com/,
      handler: "fastest",
    },
  ],
};
```

Here we want to precache all static resources located in the `dist` folder and serve them cache-first. This strategy is a huge gain in therms of performance since our application is entirely powered by JavaScript.

Traditionally the browser needs to fetch those resources through the network, parse them and execute them before user is getting his first meaningful paint. With our configuration the browser will skip the network step and **it feels like the application is booting instantly**.

We need to generate our service worker at build time. To do that we're using the sw-precache command line interface in an npm script.

```json
{
  "scripts": {
    "build:client": "webpack ---progress --config=webpack.production.config.js --mode production",
    "build:sw": "sw-precache --root=dist --config=src/client/sw-config.js",
    "postbuild:client": "npm run build:sw"
  }
}
```

Now when I build the application using the `npm run build:client` command the service worker is generated in the `dist` folder and the corresponding file begin with an array with our static resources.

```javascript
var precacheConfig = [["12.bdac597b51c5a0181cb7.js", "b019a86ed940d00c5addea643938fe96"], ["13.834a6c32791d7f770b2e.js", "8a148e8566e9fc75132281d073c1b005"], ["app-admin.d3a49e109297d25509ec.js", "dbd4b4318b4b27d0a4965395c515928c"], ["app-article.f0f074c1d52252578202.js", "c2e29022fd8e616a1640a1715d19c68b"], ["app-articles-by-tag.ca1b9eb12300758ba2a7.js", "d79c3e5bf0c95ef3ee31a417a4805088"], ["app-error.f1bc73a5bc094268f774.js", "f39e1fb8f794c350c43fbd8f642bac8a"], ["app-home.ae774d639d8b71889ed4.js", "73959e6c3804c234a7fc99412d94f44b"], ["app-login.079c3983529100517325.js", "ffcc7d91aac4f4e6d7d302b5e7d80707"], ["main.d6499075ebf858f54463.js", "fdc4d61896e2054597a32d13b22d9aec"], ["vendor.09af45d7553663427450.js", "39f9b90230a8254776dc81c12fc2016a"], ["vendors~app-admin~app-article~app-articles-by-tag~app-home.2ae4c9523050bd11a6c7.js", "acb5345b6dcccde3d2288f797d40541c"], ["vendors~app-article.3b72d27ddecb1a8721ee.js", "e9d5ae538fdeb47a2c0501cc5b35744a"], ["vendors~app-home.c34d5f552da95a4de43c.js", "25bd173a8ae31fa26834e97cad001d98"]];
var cacheName = 'sw-precache-v3-sw-precache-' + (self.registration ? self.registration.scope : '');
```

It means that our service worker detects all static resources and automatically keep those resources up to date when changes are detected in builds.

<img src="https://i.ibb.co/z8ncDKZ/Screenshot-from-2019-03-03-17-16-45.png" alt="Service worker cache storage" />

It's simple as is.
