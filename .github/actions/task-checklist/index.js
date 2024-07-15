const core = require('@actions/core');
const github = require('@actions/github');

try {
  const body = github.context.payload.pull_request?.body;
  console.log(body);
  // Fetch the value of the input 'who-to-greet' specified in action.yml
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
} catch (error) {
  // Handle errors and indicate failure
  core.setFailed(error.message);
}
