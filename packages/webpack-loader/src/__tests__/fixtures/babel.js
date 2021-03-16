import BabelCJS from './imports/babel-cjs';
import BabelESM from './imports/babel-esm';

export default function Babel() {
  return (
    <>
      <BabelCJS />
      <BabelESM />
    </>
  );
}
