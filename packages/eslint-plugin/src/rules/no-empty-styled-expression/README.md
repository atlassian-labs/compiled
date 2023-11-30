# `no-empty-styled-expression`

Discourages any `styled` expression to be used when passing empty arguments in `@compiled/react`.

Passing an empty object or no object at all causes Compiled to build extra `div/span` elements, as opposed to simply using a `div`. This leads to reduced performance and is greatly discouraged. If a wrapper is necessary, opt to use a `div` or wrap it in the empty React fragment `<> <YourComponentHere></YourComponentHere> </>`.

---

## Rule details

👎 Examples of **incorrect** code for this rule:

```
const EmptyStyledExpression = styled.div();
```

and

```
const EmptyStyledExpressionArgument = styled.div({});
```

👍 Examples of **correct** code for this rule:

```
const Wrapper = styled.div({
  backgroundColor: 'red',
  MyComponent: {
    backgroundColor: 'green',
  },
});
```

🔀 Recommendations

1. Write your code in a way that doesn't require a Wrapper
2. Use the empty React fragment: `<> <YourComponentHere></YourComponentHere> </>`
3. Use a `<div>`
