const core = require('@actions/core');
const github = require('@actions/github');

try {
  const body = github.context.payload.pull_request?.body;
  console.log(body);
  console.log(`Hello world!`);
} catch (error) {
  // Handle errors and indicate failure
  core.setFailed(error.message);
}
