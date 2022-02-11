import type { Program } from 'jscodeshift';

import type { CodemodPluginInstance } from '../plugins/types';

export const applyVisitor = ({
  plugins,
  originalProgram,
  currentProgram,
}: {
  plugins: CodemodPluginInstance[];
  originalProgram: Program;
  currentProgram: Program;
}): void => {
  for (const plugin of plugins) {
    const programImpl = plugin.visitor?.program;
    if (programImpl) {
      programImpl({
        originalProgram,
        program: currentProgram,
      });
    }
  }
};
