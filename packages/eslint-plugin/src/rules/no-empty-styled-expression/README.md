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

# 🔀 Recommendations

## Use elements directly

```diff
- const Wrapper = styled.div({});

   function App() {
-    return <Wrapper>hello world</Wrapper>;
+    return <div>hello world</div>;
  }
```

```diff
Use a React fragment
- const Wrapper = styled.div({});

   function App() {
-    return <Wrapper>hello world</Wrapper>;
+    return <>hello world</>;
  }
```
