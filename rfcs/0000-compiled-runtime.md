- Start Date: 2021-11-29
- RFC PR:
- Compiled Issue:

## Summary

Preface: This RFC builds on @MonicaOlejniczak's original thoughts around module traversal and leaving it up to the bundler (runtime) to put the pieces back together, it doesn't come with all the answers but hopefully a little bit of inspiration for where we can take Compiled in the future. This is something I've been thinking about since working on Compiled for innovation week, don't take it for the solution but merely my thoughts in the area.

---

Compiled was initially written with the assumption styles could be written in shape or form, strings, objects, arrays, it doesn't matter the library will try and handle it (use of the `css` func is optional!). To enable this to work AST traversal would always originate from three different sources:

1. styled component
2. the `css` prop
3. class names component

Traversal would start at these nodes and then work its way down and up the tree piecing together all the styles it can until it either succeeds, or reach an edge case that isn't explicitly handled. Explicit handling of ASTs is where a lot of the code in Compiled has been written to not only handle the static evaluation of styles, but also the dynamic combination of styles. This is very prevalent in the `css` prop API where each binary expression, conditional, and so on needs to be supported else you'll get a build time error.

This RFC is proposing changing Compiled to do what it does best - compile styles! While then giving more room for the runtime to put the styles back together.

## Basic example

Take the following code.

```jsx
/** @jsxImportSource @compiled/react */

const blackStyles = {
  color: 'black',
};

function Component({ isBlack }) {
  return <div css={isBlack && blackStyles} />;
}
```

Today Compiled does the following:

1. Find the JSXAttribute called `css`
2. Traverse its children
3. Find logical expression
4. Traverse the right node
5. Find identifier
6. Resolve identifier
7. Generate class name and styles
8. Transform to Compiled Component

This is a lot of steps and prone to running into edge cases unfortunately. But it does work! And allowed the initial architecture to work with any unmarked style rules. If we were to enforce that all style rules **must** be declared using the `css` function things get a little more interesting.

Taking the same example above except styles are now defined through `css` and return a data structure with compiled styles.

```diff
/** @jsxImportSource @compiled/react */
+import { css } from '@compiled/react';

-const blackStyles = {
+const blackStyles = css({
  color: 'black'
});

function Component({ isBlack }) {
  return <div css={isBlack && blackStyles} />;
}
```

Compiled would:

1. Find the `css` function call
2. Generate class name and styles
3. Lean on the runtime to do the rest

You can see a basic implementation of the above here: https://github.com/atlassian-labs/compiled/compare/babel-experiment?expand=1#diff-7c3b8f72b34155cdf17c42f282ed0cecec4fd2863ba71912213f8932159cd01bR17

## Motivation

The primary motivation is for Compiled maintainers to maintain and write less code to handle the ever increasing list of edge cases and consumers having a better developer experience because things JustWork (for the most part).

Other motivating factors:

- Reduce AST traveral
- Enable very dynamic conditional styles to work

## Detail design

This change should work with all Compiled APIs and ideally be backwards compatible if possible.

### CSS

Style rules now must be defined using `css`, still leveraging the large majority of code already written to build styles. The main difference being instead of being opaque and resolving to `null` they resolve to an object representation of both class names and styles.

```jsx
const style = css({
  color: 'black',
  ':hover': {
    color: 'red',
  },
});

// 👇 transforms to

const style = ['_syaz11x8 _30l35scu', ['._syaz11x8{color:black}', '._30l35scu:hover{color:red}']];
```

If the style rules are not declared at the top of the module they will be hoisted if safe to the top of the module.

```jsx
/** @jsxImportSource @compiled/react */

function Comp() {
  return <div css={css({ color: 'black' })} />;
}

// 👇 transforms to

const _1 = ['_syaz11x8', ['._syaz11x8{color:black}']];

function Comp() {
  return <div css={_1} />;
}
```

When referencing an expression Compiled would try to statically evaluate it, if it fails it would be added as the third item in the array for all dynamic items. This behaviour can be re-used for truly dynamic styles.

```jsx
import { N800 } from '@atlaskit/theme/colors';

const styles = css({ color: N800 });

// 👇 transforms to

const styles = ['_syaz4rde', ['._syaz4rde{color: var(--_kmurgp)}'], [['--_kmurgp', N800]]];
```

**Considerations**

- What would the best data structure be for these styles, what would encourage the fastest HOT path?
- How can we de-duplicate style declarations in the same module?

### CSS Prop

CSS prop would now be wired up at runtime for both application of class names and styles. A small jsx runtime would be created for this.

```jsx
/** @jsxImportSource @compiled/react */

const redColorStyles = css({ color: 'red' });
const hiddenStyles = css({ display: 'none' });
const largeTextStyles = css({ fontSize: 50 });

function Comp({ isRed, isHidden, isLarge }) {
  return (
    <div css={[isHidden ? hiddenStyles : [isLarge && largeTextStyles, isRed && redColorStyles]]} />
  );
}

// 👇 transforms to (css prop untouched - more dynamic application of styles is now possible)

const redColorStyles = ['_syaz5scu', ['._syaz5scu{color:red}']];
const hiddenStyles = ['_1e0cglyw', ['._1e0cglyw{display:none}']];
const largeTextStyles = ['_1wyb1sen', ['._1wyb1sen{font-size:50}']];

function Comp({ isRed, isHidden, isLarge }) {
  return (
    <div css={[isHidden ? hiddenStyles : [isLarge && largeTextStyles, isRed && redColorStyles]]} />
  );
}
```

Style extraction then becomes a matter of pointing to the extract runtime and stripping out the styles from their arrays.

```diff
-/** @jsxImportSource @compiled/react */
+/** @jsxImportSource @compiled/react/runtime */

-const redColorStyles = ["_syaz5scu", ["._syaz5scu{color:red}"]];
-const hiddenStyles = ["_1e0cglyw", ["._1e0cglyw{display:none}"]];
-const largeTextStyles = ["_1wyb1sen", ["._1wyb1sen{font-size:50}"]];
+const redColorStyles = ["_syaz5scu"];
+const hiddenStyles = ["_1e0cglyw"];
+const largeTextStyles = ["_1wyb1sen"];

function Comp({ isRed, isHidden, isLarge }) {
  return (
    <div
      css={[
        isHidden
          ? hiddenStyles
          : [isLarge && largeTextStyles, isRed && redColorStyles],
      ]}
    />
  );
}
```

### Styled

Styled components would build on the same foundations as both the `css` func & prop.

```jsx
import { css, styled } from '@compiled/react';

const Comp = styled.div`
  color: ${(props) => props.color};
  ${(props) =>
    props.isHidden
      ? css({ display: 'none' })
      : [props.isLarge && css({ fontSize: 50 }), props.isRed && css({ color: 'red' })]}
`;

// 👇 transforms to (more dynamic application of styles is now possible)
import { styled } from '@compiled/react/runtime';

const _1 = ['_1e0cglyw', ['._1e0cglyw{display:none}']];
const _2 = ['_1wyb1sen', ['._1wyb1sen{font-size:50}']];
const _3 = ['_syaz5scu', ['._syaz5scu{color:red}']];

const Comp = styled('div', (props) => [
  ['_syaz4rde', ['._syaz4rde{color: var(--_kmurgp)}'], [['--_kmurgp', props.color]]],
  props.isHidden ? _1 : [props.isLarge && _2, props.isRed && _3],
]);
```

Style extraction then becomes a matter of pointing to the extract runtime and stripping out the styles from their arrays.

```diff
-import { styled } from "@compiled/react/runtime";
+import { styled } from "@compiled/react/extract";

-const _1 = ["_1e0cglyw", ["._1e0cglyw{display:none}"]];
-const _2 = ["_1wyb1sen", ["._1wyb1sen{font-size:50}"]];
-const _3 = ["_syaz5scu", ["._syaz5scu{color:red}"]];
+const _1 = ["_1e0cglyw"];
+const _2 = ["_1wyb1sen"];
+const _3 = ["_syaz5scu"];

const Comp = styled("div", (props) => [
  [
    "_syaz4rde",
-    ["._syaz4rde{color: var(--_kmurgp)}"],
+    undefined,
    [["--_kmurgp", props.color]],
  ],
  props.isHidden ? _1 : [props.isLarge && _2, props.isRed && _3],
]);
```

### Class names

The class names component can mostly build ontop of what the previous two APIs have done, except dynamic styles prove to be a challenge so for now I've just omitted them.

```jsx
import { ClassNames } from '@compiled/react';

const redColorStyles = css({ color: 'red' });
const largeTextStyles = css({ fontSize: 50 });

function Comp(props) {
  return (
    <ClassNames>
      {({ css }) => (
        <div
          className={css([
            isHidden
              ? css({ display: 'none' })
              : [isLarge && largeTextStyles, isRed && redColorStyles],
          ])}
        />
      )}
    </ClassNames>
  );
}

// 👇 transforms to (more dynamic application of styles is now possible)

import { ClassNames } from '@compiled/react/runtime';

const _1 = ['_1e0cglyw', ['._1e0cglyw{display:none}']];
const largeTextStyles = ['_1wyb1sen', ['._1wyb1sen{font-size:50}']];
const redColorStyles = ['_syaz5scu', ['._syaz5scu{color:red}']];

function Comp(props) {
  return (
    <ClassNames>
      {({ css }) => (
        <div
          className={css([
            props.isHidden ? _1 : [props.isLarge && largeTextStyles, props.isRed && redColorStyles],
          ])}
        />
      )}
    </ClassNames>
  );
}
```

When calling `css` it uses the `ax` function internally to return a `className`,
as well as rendering the style rules inside the `ClassNames` component.

Style extraction then becomes a matter of pointing to the extract runtime and stripping out the styles from their arrays.

```diff
-import { ClassNames } from "@compiled/react/runtime";
+import { ClassNames } from "@compiled/react/extract";

-const _1 = ["_1e0cglyw", ["._1e0cglyw{display:none}"]];
-const largeTextStyles = ["_1wyb1sen", ["._1wyb1sen{font-size:50}"]];
-const redColorStyles = ["_syaz5scu", ["._syaz5scu{color:red}"]];
+const _1 = ["_1e0cglyw"];
+const largeTextStyles = ["_1wyb1sen"];
+const redColorStyles = ["_syaz5scu"];

function Comp(props) {
  return (
    <ClassNames>
      {({ css }) => (
        <div
          className={css([
            props.isHidden
              ? _1
              : [
                  props.isLarge && largeTextStyles,
                  props.isRed && redColorStyles,
                ],
          ])}
        />
      )}
    </ClassNames>
  );
}
```

**Considerations**

- What would be an idiomatic way to handle dynamic styles without needing additional AST traversal? The main problem is you need to get ahold of a `style` prop. One obvious answer is don't support it.

### Keyframes

Keyframes would operate very similarly to how `css` function would. I've opted not to flesh it out right now but let me know if you'd want it and I can.

## Drawbacks

- More runtime bundle would be added to the React package
- Dynamic declarations aren't currently considered with the ClassNames API

## Alternatives

TBD.

## Adoption strategy

TBD.

## Unresolved questions

- What edge cases may arise with extraction?
- What performance characteristics are affected by this change?
