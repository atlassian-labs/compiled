# Compiled

**Build time [atomic CSS](https://deploy-preview-11--compiled-css-in-js.netlify.app/docs/atomic-css)-in-JS.
Baked and ready to serve.**

[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](./LICENSE)
[![@compiled/react](https://img.shields.io/npm/v/@compiled/core.svg?style=flat-square)](https://www.npmjs.com/package/@compiled/react)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)

[Get started now →](https://compiledcssinjs.com/docs)

## Usage

```jsx
import { styled, ClassNames } from '@compiled/react';

// Tie styles to an element
<div css={{ color: 'purple' }} />;

// Create a component that ties styles to an element
const StyledButton = styled.button`
  color: ${(props) => props.color};
`;

// Create a component which styles are not necessarily tied to an element
<ClassNames>
  {({ css, style }) => children({ className: css({ fontSize: 12, style }) })}
</ClassNames>;
```

## Installation

Install the React package:

```bash
npm install @compiled/react
```

Configure [Babel](https://babeljs.io/docs/en/config-files):

```json
{
  "plugins": ["@compiled/react/babel-plugin"]
}
```

## Contributions

Contributions to Compiled are welcomed!
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" width="153" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
