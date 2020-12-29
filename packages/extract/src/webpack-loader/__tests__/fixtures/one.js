import '@compiled/react';
import { hydrate } from 'react-dom';

const App = () => <div css={{ fontSize: 20 }}>hello world</div>;

hydrate(<App />, document.getElementById('app'));
