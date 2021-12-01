- Start Date: 2021-11-29
- RFC PR:
- Compiled Issue:

## Summary

Preface: This RFC builds on @MonicaOlejniczak's original thoughts around module traversal and leaving it up to the bundler (runtime) to put the pieces back together, it doesn't come with all the answers but hopefully a little bit of inspiration for where we can take Compiled in the future. This is something I've been thinking about since working on Compiled for innovation week, don't take it as _the_ solution but merely my thoughts in the area.

---

Compiled was initially written with the assumption styles could be written in any shape or form, strings, objects, arrays, it doesn't matter the library will try and handle it (**remember**: use of the `css` func didn't originally exist, and when it was introduced it was **optional**!). To make this work AST traversal would always originate from three different nodes:

1. styled component declaration
2. the `css` prop
3. class names component

Traversal would start at these nodes and then work its way up and down the tree piecing together all the styles it can until it either succeeds, or reaches an edge case that isn't explicitly handled. Explicit handling of ASTs is where a lot of the code in Compiled has been written to not only handle the static evaluation of styles, but also the dynamic combination of styles. This is very prevalent in the `css` prop API where each binary expression, conditional, and so on needs to be supported else you'll get a build time error.

This RFC is proposing changing Compiled to do what it does best - static evaluation of styles! While then giving more room for the runtime to handle the dynamic combination of styles. All while still supporting style extraction.

## Basic example

Take the following code where styles are defined in an object with no clear call site.

```jsx
/** @jsxImportSource @compiled/react */

const blackStyles = {
  color: 'black',
};

function Component({ isBlack }) {
  return <div css={isBlack && blackStyles} />;
}
```

Today Compiled would do the following:

1. Find the JSXAttribute node called `css`
2. Traverse its children
3. Find a logical expression node
4. Traverse the right node
5. Find an identifier
6. Resolve the identifier
7. Statically evaluate the styles from the object
8. Generate class name and styles
9. Transform the parent of the JSXAttribute node to a Compiled Component

This is a lot of steps and prone to running into edge cases unfortunately. But it does work! And allowed the current architecture to work with any unmarked style rules. If we were to enforce that _all style rules must be declared using explicit call sites_ things start to get easier. We can take the example from above using this constraint and then transform them to a data structure Compiled can work with at runtime.

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

You can see a basic implementation of the above on the [`babel-experiment` branch](https://github.com/atlassian-labs/compiled/compare/babel-experiment?expand=1#diff-7c3b8f72b34155cdf17c42f282ed0cecec4fd2863ba71912213f8932159cd01bR17). Note only tests work, Storybook is broken.

A more technical design overview can be found further into the RFC.

## Motivation

The primary motivation is for Compiled maintainers to maintain and write less code to handle the ever increasing list of edge cases and consumers having a better developer experience because things JustWork with any number of dynamic application of styles, with supplementary motivators being improved build performance as there is less AST traversal and transformation required at build time.

### Technical design considerations

- 🤏 Minimize AST traversal & transformation
- ⛓️ One nodes transformation should not be dependent on another nodes
- 🥇 Ignore intermediate nodes - let the runtime handle it!

## Detail design

This change should work with all Compiled APIs and ensure style extraction is backwards compatible for at least one major version.

### CSS

Style rules now must be defined using clear call sites using `css` instead of raw objects or strings. We can still leverage the large majority of code already written to statically evaluate styles. The main difference however is instead of being opaque and resolving to `null` they now get transformed into a data structure Compiled can understand at runtime.

```jsx
import { css } from '@compiled/react';

const style = css({
  color: 'black',
  ':hover': {
    color: 'red',
  },
});

// 👇 transforms to

import { i } from '@compiled/react/insert';

const style = i([
  '_syaz11x8 _30l35scu',
  ['._syaz11x8{color:black}', '._30l35scu:hover{color:red}'],
]);
```

An identity function is used to flag call sites for extraction later (naming TBD). If the style rules are not declared at the top of the module they will be hoisted if safe to the top of the module.

```jsx
/** @jsxImportSource @compiled/react */

function Comp() {
  return <div css={css({ color: 'black' })} />;
}

// 👇 transforms to

const _1 = i(['_syaz11x8', ['._syaz11x8{color:black}']]);

function Comp() {
  return <div css={_1} />;
}
```

When referencing an expression Compiled would try to statically evaluate it else if it fails be added as the third item in the array along with all other dynamic styles.

```jsx
import { N800 } from '@atlaskit/theme/colors';

const styles = css({ color: N800 });

// 👇 transforms to

const styles = i(['_syaz4rde', ['._syaz4rde{color: var(--_kmurgp)}'], [['--_kmurgp', N800]]]);
```

When composing style rules together in an array they would naturally work **without any extra AST transformation**.

```jsx
const colorStyles = css({
  color: 'black',
});

const hoverStyles = css({
  ':hover': {
    color: 'red',
  },
});

const styles = css([colorStyles, hoverStyles]);

// 👇 transforms to

const colorStyles = i(['_syaz11x8', ['._syaz11x8{color:black}']]);

const hoverStyles = i(['_30l35scu', ['._30l35scu:hover{color:red}']]);

const styles = i([colorStyles, hoverStyles]);
```

**Considerations**

- Could there be a better way to mark sites for extraction?
- What would the best data structure be for these styles, what would encourage the fastest HOT path? I've chosen arrays as they don't take much bundle size vs. objects.
- How can we de-duplicate style declarations in the same module?
- Composition of style rules via object rest wouldn't be possible without further AST transformation, however it should probably remain unsupported to be in line with the [technical design considerations](#technical-design-considerations). Having only a single way to compose styles is a good thing to strive for IMO.

### Keyframes

Keyframes are a bit tricky as they can't easily lean on the same pattern the previous API leans on while still encouraging static compiled strings that can be easily extracted later in time, including module traversal intricacies.

This is probably the weakest part of this RFC currently and would **love any thoughts of how best to handle them**! In it's current state I wouldn't accept it as it goes against the [technical design considerations](#technical-design-considerations).

```jsx
import { css, keyframes } from '@compiled/react';

const fadeIn = keyframes({
  to: { opacity: 1 },
});

const styles = css({
  animationName: fadeIn,
  animationDuration: '2s',
});

// 👇 transforms to

const styles = i([
  '_5sagymdr _j7hqa2t1',
  [
    '._j7hqa2t1{animation-name:kfwl3rt}',
    '@keyframes kfwl3rt{to{opacity:1}}',
    '._5sagymdr{animation-duration:2s}',
  ],
]);
```

Note that it in essence still behaves the same as it does today. The keyframes call site is erased and merged into the style rule. I had an idea for keyframes to build its own style rule (example below) but it broke down when wanting to define animation in pseudo elements/classes so I dropped it for now.

```jsx
import { css, keyframes } from '@compiled/react';

const fadeIn = keyframes({
  to: { opacity: 1 },
});

const styles = css({
  animationName: fadeIn,
  animationDuration: '2s',
});

// 👇 transforms to

const fadeIn = i([
  '_j7hqa2t1',
  ['._j7hqa2t1{animation-name:kfwl3rt}', '@keyframes kfwl3rt{to{opacity:1}}'],
]);

const styles = i([fadeIn, ['_5sagymdr', ['._5sagymdr{animation-duration:2s}']]]);
```

Breaks idiomatic CSS so the idea was tossed.

**Considerations**

- Could there be an alternate way to implement this that leans on similar patterns as the previous API?

### CSS Prop

CSS prop would now be wired up at runtime for both application of class names and style insertion. A component would be created for this: `CompiledElement`. This component would use the `ax` function to build a `className` as well as the `CC` and `CS` components to handle SSR/client side style insertion.

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

// 👇 transforms to

const redColorStyles = i(['_syaz5scu', ['._syaz5scu{color:red}']]);
const hiddenStyles = i(['_1e0cglyw', ['._1e0cglyw{display:none}']]);
const largeTextStyles = i(['_1wyb1sen', ['._1wyb1sen{font-size:50}']]);

function Comp({ isRed, isHidden, isLarge }) {
  return (
    <div css={[isHidden ? hiddenStyles : [isLarge && largeTextStyles, isRed && redColorStyles]]} />
  );
}
```

Style extraction then becomes a matter of pointing to the extract runtime and stripping out the styles from their arrays. The extract runtime would remove all style insertion behavior reducing the bundle size.

```diff
-/** @jsxImportSource @compiled/react */
+/** @jsxImportSource @compiled/react/extract */

-const redColorStyles = i(['_syaz5scu', ['._syaz5scu{color:red}']]);
-const hiddenStyles = i(['_1e0cglyw', ['._1e0cglyw{display:none}']]);
-const largeTextStyles = i(['_1wyb1sen', ['._1wyb1sen{font-size:50}']]);
+const redColorStyles = ['_syaz5scu'];
+const hiddenStyles = ['_1e0cglyw'];
+const largeTextStyles = ['_1wyb1sen'];

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

Less edge cases and AST transformation are needed to strip the runtime. Win win!

### Styled

Styled components would build on the same foundation as both the `css` func & prop, still leaning on a runtime to do the application of class names and style insertion.

```jsx
import { css, styled } from '@compiled/react';

const Comp = styled.div`
  color: ${(props) => props.color};
  ${(props) =>
    props.isHidden
      ? css({ display: 'none' })
      : [props.isLarge && css({ fontSize: 50 }), props.isRed && css({ color: 'red' })]}
`;

// 👇 transforms to

import { styled } from '@compiled/react/insert';

const _1 = i(['_1e0cglyw', ['._1e0cglyw{display:none}']]);
const _2 = i(['_1wyb1sen', ['._1wyb1sen{font-size:50}']]);
const _3 = i(['_syaz5scu', ['._syaz5scu{color:red}']]);

const Comp = styled('div', (props) => [
  i(['_syaz4rde', ['._syaz4rde{color: var(--_kmurgp)}'], [['--_kmurgp', props.color]]]),
  props.isHidden ? _1 : [props.isLarge && _2, props.isRed && _3],
]);
```

Style extraction then becomes a matter of pointing to the extract runtime and stripping out the styles from their arrays.

```diff
-import { styled } from '@compiled/react/insert';
+import { styled } from '@compiled/react/extract';

-const _1 = i(['_1e0cglyw', ['._1e0cglyw{display:none}']]);
-const _2 = i(['_1wyb1sen', ['._1wyb1sen{font-size:50}']]);
-const _3 = i(['_syaz5scu', ['._syaz5scu{color:red}']]);
+const _1 = ['_1e0cglyw'];
+const _2 = ['_1wyb1sen'];
+const _3 = ['_syaz5scu'];

const Comp = styled('div', (props) => [
-  i([
+  [
    '_syaz4rde',
-    ['._syaz4rde{color: var(--_kmurgp)}'],
+    undefined,
    [['--_kmurgp', props.color]],
-  ]),
+  ],
  props.isHidden ? _1 : [props.isLarge && _2, props.isRed && _3],
]);
```

### Class names

The class names component can mostly build on top of what the previous APIs have done, except dynamic styles prove to be a challenge without changing the API a little. Would love a close eye on this with any thoughts in the matter!

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

// 👇 transforms to

import { ClassNames } from '@compiled/react/insert';

const _1 = i(['_1e0cglyw', ['._1e0cglyw{display:none}']]);
const largeTextStyles = i(['_1wyb1sen', ['._1wyb1sen{font-size:50}']]);
const redColorStyles = i(['_syaz5scu', ['._syaz5scu{color:red}']]);

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

Style extraction then becomes a matter of pointing to the extract runtime and stripping out the styles from their arrays.

```diff
-import { ClassNames } from '@compiled/react/insert';
+import { ClassNames } from '@compiled/react/extract';

-const _1 = i(['_1e0cglyw', ['._1e0cglyw{display:none}']]);
-const largeTextStyles = i(['_1wyb1sen', ['._1wyb1sen{font-size:50}']]);
-const redColorStyles = i(['_syaz5scu', ['._syaz5scu{color:red}']]);
+const _1 = ['_1e0cglyw'];
+const largeTextStyles = ['_1wyb1sen'];
+const redColorStyles = ['_syaz5scu'];

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

To handle dynamic runtime styles and stay in line with the [technical design considerations](#technical-design-considerations) we would need to change the API of ClassNames component slightly, `css` would return both a `className` and a `style` prop.

```jsx
import { ClassNames } from '@compiled/react';

function Comp(props) {
  return (
    <ClassNames>
      {({ css }) => {
        const [className, style] = css({ color: props.color });

        return <div className={className} style={style} />;
      }}
    </ClassNames>
  );
}

// 👇 transforms to

import { i, ClassNames } from '@compiled/react/insert';

function Comp(props) {
  return (
    <ClassNames>
      {({ css }) => {
        const [className, style] = css(
          i(['_syaz4rde', ['._syaz4rde{color: var(--_kmurgp)}'], [['--_kmurgp', props.color]]])
        );

        return <div className={className} style={style} />;
      }}
    </ClassNames>
  );
}
```

And then style extract again is pointing to the extract runtime and stripping the style sheets.

```diff
-import { i, ClassNames } from '@compiled/react/insert';
+import { ClassNames } from '@compiled/react/extract';

function Comp(props) {
  return (
    <ClassNames>
      {({ css }) => {
        const [className, style] = css(
-          i(['_syaz4rde', ['._syaz4rde{color: var(--_kmurgp)}'], [['--_kmurgp', props.color]]])
+          ['_syaz4rde', undefined, [['--_kmurgp', props.color]]
        );

        return <div className={className} style={style} />;
      }}
    </ClassNames>
  );
}
```

## Drawbacks

- More runtime bundle size would be added to the React package (however it might be a net reduction overall as every call site now uses an abstraction instead of the same markup)
- Keyframes API doesn't fit naturally within this architecture
- Dynamic declarations aren't supported in the ClassNames API without changing the API for consumers

## Alternatives

The primary alternative to discuss would be what data structure would get the best:

- Runtime performance
- Minification characteristics

It does not need to be human readable as its a compilation target.

## Adoption strategy

This change would be a big shift from what how Compiled works today. The one consideration for adoption strategy will be ensuring the style extraction (strip runtime) is backwards compatible.

To turn the new functionality on it should be introduced under some configuration where consumers can opt into the new compilation method which would then use what has been defined in this RFC.

For Webpack this could look like:

```js
module.exports = {
  module: {
    rules: [
      {
        loader: '@compiled/webpack-loader',
        options: {
          experimental: {
            localTransforms: true,
          },
        },
      },
    ],
  },
};
```

For the strip runtime it needs to be able to work with both transformation targets to ensure all sourced of Compiled transformed components will be extracted, with configuration to turn on/off legacy/experimental extraction.

## Unresolved questions

- What edge cases could arise with style extraction?
- What performance characteristics (bundle size vs. runtime) are affected by this change?
- This doesn't completely get rid of the need of module traversal (for style declaration static evaluation) - is it possible to?
