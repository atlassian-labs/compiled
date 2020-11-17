# 👷‍♀ ‍Compiled

[Read the docs →](https://compiledcssinjs.com)

## Get started

**Install**

> ⚠️ Work is in progress re-writing/architecting a new Babel plugin.
> Use the nightly at your own risk until it is officially released.

```bash
npm install @compiled/react@nightly
```

**Configure [Babel](https://babeljs.io/docs/en/config-files)**

```json
{
  "plugins": ["@compiled/react/babel-plugin"]
}
```

**Style**

```jsx
import { styled, ClassNames } from '@compiled/react';
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

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" width="153" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
