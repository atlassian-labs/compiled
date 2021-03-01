# Compiled

**Build time [atomic CSS](https://compiledcssinjs.com/docs/atomic-css)-in-JS.
Baked and ready to serve.**

[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](./LICENSE)
[![@compiled/react](https://img.shields.io/npm/v/@compiled/react?style=flat-square)](https://www.npmjs.com/package/@compiled/react)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)

[Get started now ➚](https://compiledcssinjs.com/docs/installation)

## Usage

<!-- prettier-ignore -->
```jsx
import { styled, ClassNames } from '@compiled/react';

// Tie styles to an element
<div css={{ color: 'purple' }} />

// Create a component that ties styles to an element
const StyledButton = styled.button`
  color: ${(props) => props.color};
`;

// Use a component which styles are not necessarily tied to an element
<ClassNames>
  {({ css }) => children({ className: css({ fontSize: 12 }) })}
</ClassNames>
```

## Installation

Install the [React](https://reactjs.org/) package.

```bash
npm install @compiled/react
```

Then configure your bundler of choice or use [Babel](https://babeljs.io/docs/en/config-files) directly.

### Webpack

Install the [Webpack](https://webpack.js.org) loader.

```bash
npm install @compiled/webpack-loader --save-dev
```

See [installation](https://compiledcssinjs.com/docs/installation#webpack) for more information.

### Parcel

> **Note** <br /> Parcel v2 is currently in pre-release which makes this transformer experimental, it may break when updating Parcel. Use with caution.

Install the [Parcel v2](https://v2.parceljs.org/) transformer.

```bash
npm install @compiled/parcel-transformer --save-dev
```

See [installation](https://compiledcssinjs.com/docs/installation#parcel) for more information.

### Babel

Install the [Babel](https://babeljs.io/) plugin.

```
npm install @compiled/babel-plugin --save-dev
```

See [installation](https://compiledcssinjs.com/docs/installation#babel) for more information.

## Contributions

Contributions are welcomed!
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" width="153" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.

<hr />

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
