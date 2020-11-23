// What is "ts-node.register.instance"?
// Check this => https://github.com/TypeStrong/ts-node/pull/858

const REGISTER_INSTANCE = Symbol.for('ts-node.register.instance');

declare global {
  namespace NodeJS {
    interface Process {
      [REGISTER_INSTANCE]?: object;
    }
  }
}

const isRunningInTsNode = typeof process[REGISTER_INSTANCE] === 'object';

export default isRunningInTsNode;
