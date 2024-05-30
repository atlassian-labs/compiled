# @compiled/website

**The documentation website for [Compiled](https://github.com/atlassian-labs/compiled).**

## Getting started

```bash
yarn # Install dependencies
yarn build:examples # Build examples that are using in the website
```

### Run landing page

This is the home page of the website.

```bash
yarn start:landing
```

### Run docs

This is the actual documentation.

```bash
yarn start:docs
```

## FAQ

### Why is this not in the monorepo?

This site is written with Compiled.
We want to make sure the consumption story works,
completely,
with no impacts from the monorepo.

---

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
