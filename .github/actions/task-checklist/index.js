const core = require('@actions/core');
const github = require('@actions/github');

// Detects tasks in the form:
// - [ ] Task 1
//
// Also handles whitespace around any of the characters,
// and the three different ways to make a list (dash, asterisk, plus)
const INCOMPLETE_TASKS_REGEX = /^\s*[-*+]\s+\[ \]\s+(.*)/g;

const run = () => {
  const body = github.context.payload.pull_request?.body;
  if (!body) return;

  const matches = body.matchAll(INCOMPLETE_TASKS_REGEX).map((match) => match[1]);

  if (!matches.length) {
    return;
  }

  for (const match of matches) {
    console.log(`Found incomplete task: ${match}`);
  }

  core.setFailed(`
Found an item in the PR description not marked as completed.

Please complete this task before merging.
`);
};

run();
