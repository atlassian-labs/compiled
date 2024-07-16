const core = require('@actions/core');
const github = require('@actions/github');

// Detects tasks in the form:
// - [ ] Task 1
//
// Also handles whitespace around any of the characters,
// and the three different ways to make a list (dash, asterisk, plus)
const INCOMPLETE_TASKS_REGEX = /^\s*[-*+]\s+\[ \]\s+(.*)/gm;

// This regex finds regions which we should EXCLUDE from the task checklist action.
//
// - s flag required so that ".*?" matches over multiple lines
// - "?" in ".*?" ensures that we match the smallest possible string
// - note that m flag is not required.
const DISABLE_COMMENT_REGEX =
  /<!--\s*task-checklist-ignore-start\s*-->.*?<!--\s*task-checklist-ignore-end\s*-->/gs;

const run = () => {
  const body = github.context.payload.pull_request?.body;
  if (!body) {
    console.info('PR description empty, skipping this check.');
    return;
  }

  const bodyWithoutDisables = body.replace(DISABLE_COMMENT_REGEX, '');
  if (body !== bodyWithoutDisables) {
    console.debug(
      'Found at least one "task-checklist-ignore-start"/"task-checklist-ignore-end" block.'
    );
    return;
  }

  const matches = [...body.matchAll(INCOMPLETE_TASKS_REGEX)].map((match) => match[1]);

  if (!matches.length) {
    console.info('No tasks marked as incomplete. Great work!');
    return;
  }

  const plural = matches.length > 1 ? 's' : '';
  console.error(`Found incomplete task${plural}:`);
  for (const match of matches) {
    console.error(`- ${match}`);
  }

  console.info('---');

  console.info(
    'False positive? Insert <!-- task-checklist-ignore-start --> and <!-- task-checklist-ignore-end --> in the sections of your PR where you want to skip the check. However, with great power comes great responsibility...'
  );

  console.info('---');

  core.setFailed(`
Found at least one item in the PR description not marked as completed.

Please complete all tasks in your PR description before merging.
`);
};

run();
