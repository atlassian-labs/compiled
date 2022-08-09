# styled-components-inner-ref-to-ref

> Codemod for easy migration from innerRef to ref.

## Usage

Codemods in this repository can be run with the [CodeshiftCommunity](https://www.codeshiftcommunity.com/docs/) tooling.

```bash
# Transform single file
npx @codeshift/cli --packages "@compiled/codemods#styled-components-inner-ref-to-ref" /Project/path/to/file

# Transform multiple files
npx @codeshift/cli --packages "@compiled/codemods#styled-components-inner-ref-to-ref" /Project/**/*.tsx
```

**Will modify files in place, so make sure you can recover if it goes wrong!**

## Examples

```javascript
<div innerRef={this.setRef} />
```

Is transformed to:

```javascript
<div ref={this.setRef} />
```
