import type { Result } from '../cli';

import codemods from './codemods';

interface Presets {
  [preset: string]: (result?: Result) => Promise<void>;
}
const presets: Presets = {
  codemods,
};

export default presets;
