const fs = require('fs');

/**
 * Will upgrade any dependencies of "@compiled/*" in package json to the supplied value.
 * Assumes all versions are pinned to the same one.
 */
async function setDependencyVersions(version) {
  const pkgPath = `${process.cwd()}/package.json`;
  const pkgJson = require(pkgPath);

  console.log(`👉 found workspace pkg ${pkgJson.name}`);

  let changed = false;

  const mappedDependencies = Object.entries(pkgJson.dependencies || {}).map(([key, value]) => {
    if (key.startsWith('@compiled')) {
      changed = true;
      console.log(`👉 setting ${key} to ${pkgJson.version}`);
      return [key, version.replace('v', '')];
    }

    return [key, value];
  });

  if (changed) {
    pkgJson.dependencies = Object.fromEntries(mappedDependencies);
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson));
    console.log(`👉 persisting`);
  } else {
    console.log(`👉 nothing to do`);
  }
}

setDependencyVersions(process.argv[process.argv.indexOf('--version') + 1]);
