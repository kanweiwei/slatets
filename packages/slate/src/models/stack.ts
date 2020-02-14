import { Record } from "immutable";
import logger from "slate-dev-logger";
import MODEL_TYPES from "../constants/model-types";
import memoize from "../utils/memoize";

const DEFAULTS = {
  plugins: []
};

class Stack extends Record(DEFAULTS) {
  /**
   * 属性
   */
  public plugins: any[];

  static create(attrs: any = {}) {
    const { plugins = [] } = attrs;
    const stack = new Stack({ plugins });
    return stack;
  }

  static isStack(any) {
    return !!(any && any[MODEL_TYPES.STACK]);
  }

  get object(): "stack" {
    return "stack";
  }

  getPluginsWith(property: string) {
    return this.plugins.filter(plugin => plugin[property] != null);
  }

  $$find(property: string, ...args: any[]) {
    const plugins: any[] = this.getPluginsWith(property);

    for (let i = 0, len = plugins.length; i < len; i++) {
      const ret = plugins[i][property](...args);
      if (ret != null) return ret;
    }
  }

  $$map(property: string, ...args: any[]) {
    const plugins: any[] = this.getPluginsWith(property);
    const array: any[] = [];

    for (let i = 0, len = plugins.length; i < len; i++) {
      const ret = plugins[i][property](...args);
      if (ret != null) array.push(ret);
    }

    return array;
  }

  run(property: string, ...args: any[]) {
    const plugins = this.getPluginsWith(property);

    for (let i = 0, len = plugins.length; i < len; i++) {
      const ret = plugins[i][property](...args);
      if (ret != null) return;
    }
  }

  render(property: string, props: any, ...args: any[]) {
    const plugins = this.getPluginsWith(property);
    return plugins.reduceRight(
      (children, plugin) => {
        if (!plugin[property]) return children;
        const ret = plugin[property](props, ...args);
        if (ret == null) return children;
        if (property === "renderPortal") {
          logger.deprecate(
            "0.39.0",
            "The `renderPortal` property of plugins is deprecated, please use `renderEditor` with a `<React.Fragment>` in React 16 instead."
          );
        }

        props.children = ret;
        return ret;
      },
      props.children === undefined ? null : props.children
    );
  }
}

Stack.prototype[MODEL_TYPES.STACK] = true;

memoize(Stack.prototype, ["getPluginsWith"]);

export default Stack;
