---
title: Building an immutable store from scratch with React
date: '2019-03-13T00:00:00.000Z'
tags: [javascript]
description: Learn how to build a simple store using React and Meiosis pattern.
---

We're going to create a store using React and [Meiosis](https://meiosis.js.org/).

Meiosis is not a library, you can't import it. It's a powerful pattern to manage state and it works well with view's libraries like React, Vue.js, Lit-html.

## Implementing a counter app

Meiosis is a stream based pattern, for this example I'm using the [Flyd stream library](https://github.com/paldepind/flyd). Note that is possible to not rely on any dependency by implementing the stream yourself.

The first thing we can do is designing our interfaces.

```typescript
export interface AppState {
  count: number;
}

export interface AppActions {
  increment(): void;
  decrement(): void;
}
```

Pretty simple signatures, right?

The store is a simple object containing our initial state and available actions. Here is the real power of Meiosis, we're dealing with **plain objects and functions**.

```typescript
export const store = {
  initialState: (): AppState => ({
    count: 0,
  }),
  actions: (update: StreamUpdate): AppActions => ({
    increment() {
      update((state: AppState) => {
        ++state.count;
        return state;
      });
    },
    decrement() {
      update((state: AppState) => {
        --state.count;
        return state;
      });
    },
  }),
};
```

Note that actions safely mutate the state. It's worth compared to the standard immutability approach that bring a lot of complexity between **state transitions**. Meiosis keeps this simple as stupid.

Now let's see how to build the state stream, we need only two operators to create our stream: `map` and `scan`. The last one, `scan`, is the stream equivalent of `Array.reduce` function.

```typescript
export type Stream<State> = flyd.Stream<State>;
export type StreamUpdate = flyd.Stream<UpdateFunction>;

export interface UpdateFunction {
  (state: AppState): AppState;
}

const update = flyd.stream<UpdateFunction>();
const updateState = (state: AppState, patch: UpdateFunction) => patch(state);

export const actions = store.actions(update);
export const states = flyd.scan<AppState, UpdateFunction>(
  updateState,
  store.initialState(),
  update
);
```

In summary here is how the above code example works:

1. The `states` stream takes our initial state using the `scan` operator.
2. The `update` stream emits our actions, here `increment` or `decrement`.
3. The `states` stream handles `update` emission and patches the old state.
4. The new state is emitted in the `states` stream.

Next to this we need to pass `actions` and `states` as props to our React app.

```tsx
render(
  <App actions={actions} states={states} />,
  document.getElementById('root')
);
```

The current state is available using the `stream.map` operator provided by the `states` props. Now, when an action is dispatched a `setState` is triggered which automatically re-renders our view.

```tsx
class App extends React.Component<AppProps, AppState> {
  state: AppState;
  props: AppProps;

  constructor(props: AppProps) {
    super(props);
    this.state = props.states();
  }

  componentDidMount(): void {
    this.props.states.map((state) => {
      this.setState(state);
    });
  }

  render(): JSX.Element {
    const { count } = this.state;
    const { increment, decrement } = this.props.actions;

    return (
      <div className="App">
        <h1>count: {count}</h1>
        <button className="increment" onClick={increment}>
          Increment
        </button>
        <button className="decrement" onClick={decrement}>
          Decrement
        </button>
      </div>
    );
  }
}
```

## Benefits

With Meiosis we're importing nothing to the view, **actions** and **states** are passed to our app as **props**. It means that our React app doesn't rely on our store implementation. **It's transparent**, state managers like Redux are doing a lot of stuff behind the scene. As you saw Meiosis can be fully implemented in a couples of 30 lines of code. It really forces you to think about how to design the state and not how to deal with tools.

- We have a root state in our app which is the single source of truth.
- The code is deterministic, we can run it many times it's gonna re-render exactly the same thing.
- We know exactly what's going to happen because all of the code was written by ourself.

## Final note

I'm not trying to convince you to drop Redux or something else, but learning Meiosis can helps you to understand exactly what state managers are trying to solve. It's also a good way to go deeper into functional programming.

I highly recommend you to visit the [Meiosis website](https://meiosis.js.org), they go deeper than I did, it's really interesting. They also offer a [small package](https://github.com/foxdonut/meiosis-tracer) to time travel across states like the Redux Chrome extension, it's a good catch for development purpose.

Here is the [complete working example](https://codesandbox.io/s/0193mp6kmp) of our counter app.

<iframe
  src="https://codesandbox.io/embed/0193mp6kmp?fontsize=14"
  className="iframe"
  title="Meiosis state pattern using React"
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
></iframe>
