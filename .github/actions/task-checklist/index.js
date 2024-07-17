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
    core.info('PR description empty, skipping this check.');
    return;
  }

  const bodyWithoutDisables = body.replace(DISABLE_COMMENT_REGEX, '');
  if (body !== bodyWithoutDisables) {
    core.notice(
      'Found at least one "task-checklist-ignore-start"/"task-checklist-ignore-end" block. Items in these blocks will be ignored.'
    );
    core.info('---');
  }

  const matches = [...bodyWithoutDisables.matchAll(INCOMPLETE_TASKS_REGEX)].map(
    (match) => match[1]
  );

  if (!matches.length) {
    core.info('No tasks marked as incomplete. Great work!');
    return;
  }

  const plural = matches.length > 1 ? 's' : '';
  const formattedMatches = matches.map((match) => `- ${match}`).join('\n');
  core.error(`Found incomplete task${plural}:\n${formattedMatches}`);

  core.info('---');
  core.notice(
    'False positive? Insert <!-- task-checklist-ignore-start --> and <!-- task-checklist-ignore-end --> in the section(s) of your PR where you want to skip the check.\n' +
      'However, with great power comes great responsibility...'
  );
  core.info('---');

  core.setFailed(
    `Found ${matches.length} task${plural} in the PR description not marked as completed.\n\n` +
      'Please complete all tasks in your PR description before merging.'
  );
};

run();
