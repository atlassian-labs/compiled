PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

npx workspaces-run --ignore @compiled/website -- npm version $PACKAGE_VERSION --allow-same-version
npx workspaces-run --ignore @compiled/website -- node ../../scripts/set-compiled-deps.js --version $PACKAGE_VERSION
