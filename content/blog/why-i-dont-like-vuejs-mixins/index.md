---
title: Why I don't like Vue.js mixins
date: '2020-08-01T00:00:00.000Z'
tags: [javascript]
description: Vue.js comes with its mixin concept to share logic between components, but it quickly shows its limits. Let's see why and what alternatives we have.
---

Vue.js comes with its mixin concept **to share logic between components**, this way we can extract common properties into a separate module.

```js
export default {
  data: () => ({
    users: [],
  }),
  methods: {
    async getUsers() {
      const response = await fetch('/api/users');
      this.users = await response.json();
    },
  },
};
```

Then we can extend our component to use this mixin.

```js
import UserMixin from './user-mixin';

export default {
  // highlight-start
  mixins: [UserMixin],
  // highlight-end
  data: () => ({
    isVisible: false,
  }),
  methods: {
    toggle() {
      this.isVisible = !this.isVisible;
    },
  },
};
```

Which result in the following runtime component definition.

```js
export default {
  data: () => ({
    // highlight-start
    users: [],
    // highlight-end
    isVisible: false,
  }),
  methods: {
    // highlight-start
    async getUsers() {
      const response = await fetch('/api/users');
      this.users = await response.json();
    },
    // highlight-end
    toggle() {
      this.isVisible = !this.isVisible;
    },
  },
};
```

At the beginning the mixin pattern seem to work well for sharing code, but it quickly shows its limits. Let's see why.

### Mixins break encapsulation

It's possible that some mixins cannot be used together. For example if two mixins declare the same `doSomething()` method, it will break because the last declared mixin wins. In this case the component also cannot define its own `doSomething()` method.

It's quite difficult to fix name collisions because we need first to refactor the mixin, then find and refactor all the consuming components and mixins, which can be very complicated in a big project.

**Once used a mixin is hard to change, hard to refactor.**

### Complexity snowballing

It's impossible to know from the template part if a property or a method comes from the component itself or from a mixin. The relation between components and mixins is implicit.

It increases the mental charge to find what's wrong if there is a bug. Where does the problem come from? The component? A mixin? Which one?

**We’d have to manually search them all to know**.

The more we use mixins in a project the more it becomes hard to reason about how components and mixins are coupled.

### What alternatives do we have?

#### 👍🏼 Using an ES module

The naive solution, if the function isn't doing anything Vue specific, is simply using an ES module to share your code across components.

```js
export async function getUsers() {
  const response = await fetch('/api/users');
  return await response.json();
}
```

Then we can just import it in our components.

```vue
<template>
  <div>
    <div v-for="user in users" :key="user.id">
      {{ user.name }}
    </div>
  </div>
</template>

<script>
  import { getUsers } from './get-users';

  export default {
    data: () => ({
      users: [],
    }),
    async mounted() {
      this.users = await getUsers();
    },
  };
</script>
```

This way we can easily test our `getUsers` function, because there's no need to create a test component using `@vue/test-utils`.

The downside is that we can not share any logic that rely on Vue, which is very limiting.

#### 👍🏼👍🏼 Using the composition API

The new fancy way to share code between components is using the [composition API](https://composition-api.vuejs.org/) which is compatible with both Vue 2 and 3.

Note that everything related to composition is just an addition to the Vue API, which means that you can incrementally build with the Composition API.

After the library gets correctly installed we can create **reusable chunks of code** as the following.

```js
import { ref, onMounted } from '@vue/composition-api';

export const useGetUsers = () => {
  const users = ref([]);

  onMounted(async () => {
    const response = await fetch('/api/users');
    users.value = await response.json();
  });

  return { users };
};
```

Now inside the `setup` function I can call the `useGetUsers` function and bind it to the view.

```vue
<template>
  <div>
    <div v-for="user in users" :key="user.id">
      {{ user.name }}
    </div>
  </div>
</template>

<script>
  import { useGetUsers } from 'use-get-users';

  export default {
    setup() {
      return { ...useGetUsers() };
    },
  };
</script>
```

Everything inside my `useGetUsers` is encapsuled which means that no name collision can happen. With composition, relations are explicit. I easily know where a property come from.

```js
import { useFeatureA } from 'use-feature-a';
import { useFeatureB } from 'use-feature-b';

export default {
  setup() {
    return { ...useFeatureA(), ...useFeatureB() };
  },
};
```

As you can see it's pretty trivial to use composition to create complex UIs with a higher code reusability.
