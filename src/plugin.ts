import * as I from './interfaces/';

import { Scrollbar } from './scrollbar'; // used as type annotations

export class ScrollbarPlugin implements I.ScrollbarPlugin {
  static pluginName = '';
  static defaultOptions: any = {};

  readonly scrollbar: Scrollbar;
  readonly options: any;

  constructor(
    scrollbar: Scrollbar,
    options: any,
  ) {
    this.scrollbar = scrollbar;

    // DO NOT use { ...options } here
    // we need options to be real-time
    this.options = Object.assign(options, new.target.defaultOptions);
  }

  onInit() {}
  onDestory() {}

  onUpdate() {}
  onRender(_remainMomentum: I.Data2d) {}

  transformDelta(delta: I.Data2d, _evt: Event): I.Data2d {
    return { ...delta };
  }
}

export type PluginMap = {
  order: Set<string>,
  constructors: {
    [name: string]: typeof ScrollbarPlugin,
  },
};

export const globalPlugins: PluginMap = {
  order: new Set<string>(),
  constructors: {},
};

export function addPlugins(
  ...Plugins: (typeof ScrollbarPlugin)[],
): void {
  Plugins.forEach((P) => {
    const { pluginName } = P;

    if (!pluginName) {
      throw new TypeError(`plugin name is required`);
    }

    globalPlugins.order.add(pluginName);
    globalPlugins.constructors[pluginName] = P;
  });
}

export function initPlugins(
  scrollbar: Scrollbar,
  options: any,
): ScrollbarPlugin[] {
  return Array.from(globalPlugins.order)
    .filter((pluginName: string) => {
      return options[pluginName] !== false;
    })
    .map((pluginName: string) => {
      const Plugin = globalPlugins.constructors[pluginName];

      // convert to read-only
      Object.defineProperty(options, pluginName, {
        value: options[pluginName] || {},
        writable: false,
        enumerable: true,
        configurable: false,
      });

      return new Plugin(scrollbar, options[pluginName]);
    });
}
