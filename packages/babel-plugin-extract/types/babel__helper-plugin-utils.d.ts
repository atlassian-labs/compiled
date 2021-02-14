declare module '@babel/helper-plugin-utils' {
  import { PluginObj } from '@babel/core';

  export interface Api {
    assertVersion(version: number): void;
  }

  export function declare<Pass extends {}>(cb: (api: Api) => PluginObj<Pass>): PluginObj<Pass>;
}
