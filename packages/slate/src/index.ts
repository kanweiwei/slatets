import Block from "./models/block";
import Change from "./models/change";
import Changes from "./changes";
import Data from "./models/data";
import Document from "./models/document";
import Decoration from "./models/decoration";
import Selection from "./models/selection";
import History from "./models/history";
import Inline from "./models/inline";
import KeyUtils from "./utils/key-utils";
import Leaf from "./models/leaf";
import Mark from "./models/mark";
import Node from "./models/node";
import Operation from "./models/operation";
import Operations from "./operations";
import PathUtils from "./utils/path-utils";
import Point from "./models/point";
import Range from "./models/range";
import Schema from "./models/schema";
import Stack from "./models/stack";
import Text from "./models/text";
import TextUtils from "./utils/text-utils";
import Value from "./models/value";
import Key from "./utils/key-utils";
import { resetMemoization, useMemoization } from "./utils/memoize";

import {
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_ELEMENT,
  NODE_TO_PARENT,
  EDITOR_TO_ELEMENT,
  KEY_TO_NODE,
} from "./utils/weak-maps";

import "./interfaces/common";
import "./interfaces/node";
import "./interfaces/range";

/**
 * Export.
 *
 * @type {Object}
 */

export {
  Block,
  Change,
  Changes,
  Data,
  Document,
  Decoration,
  Selection,
  History,
  Inline,
  KeyUtils,
  Leaf,
  Mark,
  Node,
  Operation,
  Operations,
  PathUtils,
  Point,
  Range,
  resetMemoization,
  Schema,
  Key,
  Stack,
  Text,
  TextUtils,
  useMemoization,
  Value,
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_ELEMENT,
  NODE_TO_PARENT,
  EDITOR_TO_ELEMENT,
  KEY_TO_NODE,
};

window.KEY_TO_ELEMENT = KEY_TO_ELEMENT;
window.ELEMENT_TO_NODE = ELEMENT_TO_NODE;
window.NODE_TO_INDEX = NODE_TO_INDEX;
window.NODE_TO_KEY = NODE_TO_KEY;
window.NODE_TO_ELEMENT = NODE_TO_ELEMENT;
window.NODE_TO_PARENT = NODE_TO_PARENT;
window.EDITOR_TO_ELEMENT = EDITOR_TO_ELEMENT;
window.KEY_TO_NODE = KEY_TO_NODE;

export default {
  Block,
  Changes,
  Data,
  Document,
  Decoration,
  Selection,
  History,
  Inline,
  KeyUtils,
  Leaf,
  Mark,
  Node,
  Operation,
  Operations,
  PathUtils,
  Point,
  Range,
  resetMemoization,
  Schema,
  Key,
  Stack,
  Text,
  TextUtils,
  useMemoization,
  Value,
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_ELEMENT,
  NODE_TO_PARENT,
  EDITOR_TO_ELEMENT,
  KEY_TO_NODE,
};
