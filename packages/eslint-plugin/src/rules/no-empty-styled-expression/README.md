# `no-empty-styled-expression`

Discourages any `styled` expression to be used when passing empty arguments in `@compiled/react`.

Passing an empty object or no object at all causes Compiled to build extra `div` elements as opposed to simply using a `div`. This leads to reduced performance and is greatly discouraged. If a wrapper is necessary, opt to use a `div` or wrap it in the empty React fragment `<> <YourComponentHere></YourComponentHere> </>`.

---

## Rule details

👎 Examples of **incorrect** code for this rule:

```
const Wrapper = styled.div();

function Button() {
  return <Wrapper>
    <MyComponent>Hello</MyComponent>
    <MyOtherComponent>world</MyOtherComponent>
  </Wrapper>;
}
```

and

```
const Wrapper = styled.div({});

function Button() {
  return <Wrapper>
    <MyComponent>Hello</MyComponent>
    <MyOtherComponent>world</MyOtherComponent>
  </Wrapper>;
}
```

👍 Examples of **correct** code for this rule:

```
const Wrapper = styled.div({
  backgroundColor: 'red',
  MyComponent: {
    backgroundColor: 'green',
  },
});

function Button() {
  return <Wrapper>
    <MyComponent>Hello</MyComponent>
    <MyOtherComponent>world</MyOtherComponent>
  </Wrapper>;
}
```

🔀 Work Arounds and Recommendations

1. Write your code in a way that doesn't require a Wrapper
2. Use the empty React fragment: `<> <YourComponentHere></YourComponentHere> </>`
3. Use a `<div>`
