# 👷‍♀ ‍Compiled

[Read the docs →](https://compiledcssinjs.com)

## Get started

**Install**

> ⚠️ Work is in progress re-writing/architecting a new Babel plugin.
> Use the nightly at your own risk until it is officially released.

```bash
npm install @compiled/core@nightly @compiled/babel-plugin@nightly
```

**Configure [Babel](https://babeljs.io/docs/en/config-files)**

```json
{
  "plugins": ["@compiled/babel-plugin"]
}
```

**Style**

```jsx
import { styled, ClassNames } from '@compiled/core';
import { background } from './tokens';

const StyledButton = styled.button`
  color: ${props => props.color};
  background-color: ${background};
`;

<StyledButton css={{ fontSize: 16 }} />

<ClassNames>{({ css }) => <div className={css`font-size: 24`} />}</ClassNames>
```

## Contributing

Thank you for considering to contribute to Compiled!
Before doing so please make sure to read our [contribution guidelines](/CONTRIBUTING.md).

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
