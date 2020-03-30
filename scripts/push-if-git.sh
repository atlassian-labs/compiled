if [[ $GITHUB_RUN_ID ]]
then
  echo "👉 we are in CI, skipping pushing"
  exit 0
fi

echo "👉 pushing it real good"
git push && git push --tags
