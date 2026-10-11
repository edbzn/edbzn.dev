---
title: Experimenting with lit-html
date: '2018-12-21T00:00:00.000Z'
tags: [javascript]
---

The Polymer team at Google work on a [higher abstraction over web components](https://www.polymer-project.org/blog/2018-12-13-lit-html-rc). I use that library from the `0.10.0` version and today I migrated an app to the `1.0.0-rc.1`.

This view library is incredibly light (3kb), intuitive and fast. A lot of people started to use it after the [Polymer Summit](https://www.youtube.com/watch?v=ruql541T7gc) presentation talk.

### Rendering view with lit-html

We use functional programming to create and compose our views. We can formulate our rendering logic with the following : `UI = fn(data)`.

Lit concepts are pretty common for a frontend developer: life-cycle, directive, binding... There is a lot in common with React, but without the JSX and the **virtual-DOM** buzz-word.

To render a template with Lit we use a native functionality of JavaScript (ES6) : the **literal template** which let us interpolate dynamic values :

```javascript
const sayHello = (name) => html`hello ${name}`;
render(sayHello('Giles Jown'), document.body);
// => hello Giles Jown
```

Using the `render` function Lit build and update the DOM when an expression changed. Immutability is required when changing the state, otherwise the _re-rendering_ does not operate.

Lit also comes with its directive concept, which is function that will be executed during the rendering process. This way we can factorize many rendering behaviors.

```javascript
const getUserProfile = (userId) =>
  fetch(`https://my-awesome-api/user/${userId}`).then(
    (resp) => resp.json(),
    (err) => console.error(err)
  );

render(
  until(
    getUserProfile().then((user) => html`Hello ${user.name}`),
    html`Loading data...`
  ),
  document.body
);
```

There are several built-in directives, for example `until` which display a fallback content while the given Promise isn't resolved yet. Lit is also highly extensible, we can built our own directives.

### Building a web component

Now let's see how to use the lit-html rendering logic in a higher building block. With **lit-element** we can embed the template, the style and the JavaScript in a web component. It's just a tiny _wrapper_ around the [native web components](https://www.webcomponents.org/introduction).

```typescript
import { css, html, LitElement, property } from 'lit-element';
import { nothing } from 'lit-html';

export default class PageComponent extends LitElement {
  @property({ type: Boolean })
  showNavbar = true;

  static get styles() {
    return css`
      .page-wrapper {
        max-width: 780px;
        margin: 0 auto;
      }
    `;
  }

  render() {
    return html`
      ${this.showNavbar ? html`<ez-navbar></ez-navbar>` : nothing}
      <main class="page-wrapper"><slot></slot></main>
      <ez-footer></ez-footer>
    `;
  }
}

customElements.define('ez-page', PageComponent);
```

Lit-element works well with TypeScript, just as Angular it relies on annotations to declare component properties. Now I can display our components using the `render` function :

```javascript
render(
  html`
    <ez-navbar></ez-navbar>
    <ez-profile></ez-profile>
    <ez-page .show-navbar="${false}">
      <ez-article-feed></ez-article-feed>
      <ez-twitter-feed></ez-twitter-feed>
      <ez-github-feed></ez-github-feed>
    </ez-page>
  `,
  document.body
);
```

Or directly in the HTML document :

```html
<body>
  <ez-navbar></ez-navbar>
  <ez-page>
    <ez-article-feed></ez-article-feed>
    <ez-twitter-feed></ez-twitter-feed>
    <ez-github-feed></ez-github-feed>
  </ez-page>
  <script src="bundle.js"></script>
</body>
```

Like every SPA components will be rendered only when the `bundle.js` file will be parsed and executed by the browser.

### What differences with the rest of the market?

Lit offers a nice alternative to the classic Angular, Vue and React with some different ideas. Lit Element relies on native web components, which is the only one to do this today. **Web components come with a bunch of pros and cons**, it's up to you to decide when it's appropriate or not.

Lit is fresh, it uses modern JavaScript to run extremely fast in the browser while keeping our bundle light.

However I do not recommend using lit for any use cases. You will need to compose with a bunch of others libraries (HTTP client, routing...) to build a real-world SPA, which leads in high maintenance costs.

Also we take the risk to build our app in a non-conventional way since we can stick with every library.

For me the biggest downside is the Server Side Rendering incompatibility which exclude using lit for any SEO oriented apps.

If you want to go further there is [a list of well crafted applications with Lit](https://pwa-starter-kit.polymer-project.org/sample-apps/).
