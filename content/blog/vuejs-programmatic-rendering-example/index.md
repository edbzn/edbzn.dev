---
title: Vue.js programmatic rendering example
date: '2020-08-30T00:00:00.000Z'
description: Learn how to use Vue.js render function to programmatically render elements.
tags: [javascript]
---

I recently started working on a Vue.js components library and I ran into the following rendering problem.

I wanted a generic button component that dynamically renders the right inner HTML element which is `<a>` if there is a `href` props and a `<button>` otherwise.

```html
<!-- ./Button.vue -->
<template>
  <a
    v-if="href"
    :href="href"
    :disabled="disabled"
    :class="classes"
    @click="onClick"
  >
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :class="classes"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script>
  {
    props: {
      href: String,
      type: String,
      outlined: Boolean,
      disabled: Boolean,
    },
    computed: { ... },
    methods: { ... },
  }
</script>
```

I firstly come with this template-based solution using both `<a>` and `<button>` conditionally displayed using a `v-if` in the template.

It works, but it doesn't feel perfect since we need to repeat ourself. Let's improve the previous code by using a [render function](https://vuejs.org/v2/guide/render-function.html) :

```html
<!-- ./Button.vue -->
<script>
  {
    props: {
      href: String,
      type: String,
      outlined: Boolean,
      disabled: Boolean,
    },
    methods: { ... },

    render(createElement) {
      const isLink = this.href != null

      return createElement(
        isLink ? 'a' : 'button',
        {
          class: {
            'is-disabled': this.disabled,
            'is-outlined': this.outlined,
          },
          attrs: {
            href: isLink ? this.href : null,
            type: isLink ? null : this.type,
          },
          on: { click: this.onClick }
        },
        this.$slots.default
      )
    }
  }
</script>
```

Now the inner button element is programmatically created, this **removes the repetition in the template** for passing attributes, classes, listeners and so on.

Concretely we can replace all the template functionalities like `v-if` and `v-for` by a `if` / `else` statement or a `Array.prototype.map` in the `render` function.

This can be useful in many other situations, like for rendering a list without a root element which is not allowed in the template.

