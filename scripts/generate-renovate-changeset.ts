// This script is designed so that Renovate can automatically add changesets to the PRs it
// creates. It is designed to be run in the root of the repo.

import fs = require('fs');

import changesetsGit = require('@changesets/git');

changesetsGit
  .getChangedPackagesSinceRef({ cwd: process.cwd(), ref: 'origin/master' })
  .then((changedPackages) => {
    let fileContents = '---\n';

    for (const pack of changedPackages) {
      fileContents += `'${pack.packageJson.name}': patch\n`;
    }

    fileContents += '---\n';
    fileContents += '\n';
    fileContents += 'Bumping dependencies via Renovate\n';

    const changesetId = Math.floor(Math.random() * 10000000);
    fs.writeFileSync(`.changeset/renovate-changeset-${changesetId}.md`, fileContents);
  });
