/**
 * The interface that all Slate models implement.
 *
 * @type {Class}
 */

abstract class BaseCommon {
  abstract toJSON(options?: any): any;

  toJS(...args: any[]) {
    return this.toJSON(...args);
  }
}

// mixin(CommonInterface, [
//   Block,
//   Change,
//   Decoration,
//   Document,
//   History,
//   Inline,
//   Leaf,
//   Mark,
//   Node,
//   Operation,
//   Point,
//   Range,
//   Schema,
//   Selection,
//   Stack,
//   Text,
//   Value,
// ]);

export default BaseCommon;
