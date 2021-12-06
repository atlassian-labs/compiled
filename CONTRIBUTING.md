# Contributing to Compiled

Thank you for considering to contribute to Compiled!
Pull requests, issues and comments are welcome.

For pull requests,
please:

- Add tests for new features and bug fixes
- Follow the existing style
- Separate unrelated changes into multiple pull requests

See the [existing issues](https://github.com/atlassian-labs/compiled/issues) for things to start contributing.

For bigger changes,
please make sure you start a discussion first by creating an issue and explaining the intended change.

Atlassian requires contributors to sign a Contributor License Agreement,
known as a CLA.
This serves as a record stating that the contributor is entitled to contribute the code/documentation/translation
to the project and is willing to have it used in distributions and derivative works (or is willing to transfer ownership).

Prior to accepting your contributions we ask that you please follow the appropriate link below to digitally sign the CLA.
The Corporate CLA is for those who are contributing as a member of an organization and the individual CLA is for those contributing as an individual.

- [CLA for individuals](https://opensource.atlassian.com/individual)
- [CLA for corporate contributors](https://opensource.atlassian.com/corporate)

## Getting started with local development

Make sure to install dependencies with `yarn` locally before continuing.

### Unit tests

Run tests locally where `<filter>` can be omitted,
a file path,
or a partial file name.

```bash
yarn test <filter> --watch
```

Looking at tests first is generally the best way to get started.

### Storybook

Run [storybook](https://storybook.js.org/) locally.

```bash
yarn start
```

### Visual regression tests

We use [Loki](https://github.com/oblador/loki) for visual regression tests.

Start a [storybook](https://storybook.js.org/) in another terminal (`yarn start`)

```bash
yarn vr:test
```

If there are expected changes, you can accept them with the command in the test or use the approve command.

```bash
yarn test:vr update --storiesFilter="^...\$"
yarn vr:test approve
```

### Helpful links

- [astexplorer.net](astexplorer.net) — When working on the Babel Plugin make sure to utilise this,
  it's a super useful tool that can visualize the abstract syntax tree (AST).
- [Babel Handbook](https://github.com/jamiebuilds/babel-handbook) — For getting started with Babel Plugins have a read of this first.
