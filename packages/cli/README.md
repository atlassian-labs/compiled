Compiled CLI
============

Useful commands for analysing Compiled's output.

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @compiled/cli
$ compiled-cli COMMAND
running command...
$ compiled-cli (--version)
@compiled/cli/0.0.1 darwin-arm64 node-v16.15.0
$ compiled-cli --help [COMMAND]
USAGE
  $ compiled-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`compiled-cli analyze-compiled-css FILENAME`](#compiled-cli-analyze-compiled-css-filename)
* [`compiled-cli autocomplete [SHELL]`](#compiled-cli-autocomplete-shell)
* [`compiled-cli help [COMMANDS]`](#compiled-cli-help-commands)

## `compiled-cli analyze-compiled-css FILENAME`

Analyse a compiled-css.css file and get some stats of how many ineffective and non-reusable selectors are being used.

```
USAGE
  $ compiled-cli analyze-compiled-css FILENAME [--removeLastLine] [--cssVariableFilter <value>]

ARGUMENTS
  FILENAME  Path to the compiled-css.css file we would like to analyse

FLAGS
  --cssVariableFilter=<value>  In the report, we exclude all CSS variables that start with the value of the
                               cssVariableFilter flag.
  --removeLastLine             Remove the last line of the file before analysing it. We may want to do this because the
                               last line is often a sourcemap comment (which we want to ignore).

DESCRIPTION
  Analyse a compiled-css.css file and get some stats of how many ineffective and non-reusable selectors are being used.

EXAMPLES
  $ compiled-cli --removeLastLine --cssVariableFilter="ds-" compiled-css.css
  Analysing compiled-css.css file...
  ====================================
  Number of rules:                4000
  ------------------------------------
  PROBLEMATIC:
  ------------------------------------
  Has inline image:               5
  Has nested selector:            1000
  Uses CSS variables:             250
  ====================================
  Done.
```

_See code: [dist/commands/analyze-compiled-css/index.ts](https://github.com/atlassian-labs/compiled/blob/v0.0.1/dist/commands/analyze-compiled-css/index.ts)_

## `compiled-cli autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ compiled-cli autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ compiled-cli autocomplete

  $ compiled-cli autocomplete bash

  $ compiled-cli autocomplete zsh

  $ compiled-cli autocomplete powershell

  $ compiled-cli autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v2.3.0/src/commands/autocomplete/index.ts)_

## `compiled-cli help [COMMANDS]`

Display help for compiled-cli.

```
USAGE
  $ compiled-cli help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for compiled-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_
<!-- commandsstop -->