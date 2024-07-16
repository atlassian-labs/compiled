const core = require('@actions/core');
const github = require('@actions/github');

// Detects tasks in the form:
// - [ ] Task 1
//
// Also handles whitespace around any of the characters,
// and the three different ways to make a list (dash, asterisk, plus)
const INCOMPLETE_TASKS_REGEX = /^\s*[-*+]\s+\[ \]\s+(.*)/gm;
const DISABLE_COMMENT_REGEX = /<!--\s*task-checklist-ignore\s*-->/;

const run = () => {
  const body = github.context.payload.pull_request?.body;
  if (!body) {
    console.log('PR description empty, skipping this check.');
    return;
  }

  const disableCommentMatch = body.match(DISABLE_COMMENT_REGEX);
  if (disableCommentMatch) {
    console.log('Found "task-checklist-ignore" comment - skipping checklist tasks.');
    return;
  }

  const matches = [...body.matchAll(INCOMPLETE_TASKS_REGEX)].map((match) => match[1]);

  if (!matches.length) {
    console.log('No tasks marked as incomplete. Great work!');
    return;
  }

  const plural = matches.length > 1 ? 's' : '';
  console.error(`Found incomplete task${plural}:`);
  for (const match of matches) {
    console.error(`- ${match}`);
  }

  console.log('---');

  console.log(
    'False positive? Insert <!-- task-checklist-ignore --> in your PR description to skip this check. However, with great power comes great responsibility...'
  );

  console.log('---');

  core.setFailed(`
Found at least one item in the PR description not marked as completed.

Please complete all tasks in your PR description before merging.
`);
};

run();
