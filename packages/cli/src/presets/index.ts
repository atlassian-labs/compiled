import { Result } from '../cli';

import codemods from './codemods';

type Presets = {
  [preset: string]: (result?: Result) => Promise<void>;
};
const presets: Presets = {
  codemods,
};

export default presets;
