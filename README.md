# Compiled

**Build time atomic CSS in JS without the runtime cost.
Bake,
consume,
extract.
Everywhere.**

[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](./LICENSE)
[![@compiled/core](https://img.shields.io/npm/v/@compiled/core.svg?style=flat-square)](https://www.npmjs.com/package/@compiled/core)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)

[Read the docs →](https://compiledcssinjs.com)

## Usage

```jsx
import { styled } from '@compiled/core';

// Define styles with the CSS prop
<div css={{ color: 'purple' }} />;

// Create a component with associated styles
const StyledButton = styled.button`
  color: ${(props) => props.color};
`;

// Define extra styles with the CSS prop
<StyledButton css={{ fontSize: 16 }} color="pink" />;
```

## Installation

Install the core library:

```bash
npm install @compiled/react
```

Configure [Babel](https://babeljs.io/docs/en/config-files):

```json
{
  "plugins": ["@compiled/react/babel-plugin"]
}
```

Style your components!

## Contributions

Contributions to Compiled are welcomed!
Please see [CONTRIBUTING.md](./CONTRIBUTING.md) fo details.

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" width="153" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
