declare module '@babel/helper-plugin-utils' {
  import { PluginObj } from '@babel/core';

  export interface Api {
    assertVersion(version: number): void;
  }

  export function declare<State extends {}>(cb: (api: Api) => PluginObj<State>): PluginObj<State>;
}
