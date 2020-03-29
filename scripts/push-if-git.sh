if git rev-parse --git-dir > /dev/null 2>&1; then
  : # This is a valid git repository (but the current working
    # directory may not be the top level.
    # Check the output of the git rev-parse command if you care)
    git push && git push --tags
else
  : # this is not a git repository
  echo "Not a git repo, skipping push"
fi
