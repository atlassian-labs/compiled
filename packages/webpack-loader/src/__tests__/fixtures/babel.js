import BabelCJS from 'babel-cjs';
import BabelESM from 'babel-esm';

export default function Babel() {
  return (
    <>
      <BabelCJS />
      <BabelESM />
    </>
  );
}
