#!/usr/bin/env bash

DIST_NIGHTLY_VERSION=$(npm dist-tag ls @compiled/react@nightly | grep nightly | cut -b 10-)
LOCAL_GIT_HASH=$GITHUB_SHA

echo "Nighyly version: $DIST_NIGHTLY_VERSION"
echo "Local git hash: $LOCAL_GIT_HASH"

if [[ $DIST_NIGHTLY_VERSION =~ $LOCAL_GIT_HASH ]]
then
  echo "👉 nightly tag has the same hash, abort"
  exit 1
fi

echo "👉 nightly has a different hash, continue"
exit 0
