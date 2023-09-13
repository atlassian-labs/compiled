import { ac } from '@compiled/react/runtime';

export default ({ xcss, children }) => <div className={ac([xcss])}>{children}</div>;
