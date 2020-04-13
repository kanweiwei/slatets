import Editor from "./components/editor";
import cloneFragment from "./utils/clone-fragment";
import findDOMNode from "./utils/find-dom-node";
import findDOMRange from "./utils/find-dom-range";
import findNode from "./utils/find-node";
import findRange from "./utils/find-range";
import getEventRange from "./utils/get-event-range";
import getEventTransfer from "./utils/get-event-transfer";
import setEventTransfer from "./utils/set-event-transfer";
import AfterPlugin from "./plugins/after";
import BeforePlugin from "./plugins/before";

import {
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_ELEMENT,
  NODE_TO_PARENT,
  EDITOR_TO_ELEMENT,
} from "./utils/weak-maps";

/**
 * Export.
 *
 * @type {Object}
 */

export {
  Editor,
  cloneFragment,
  findDOMNode,
  findDOMRange,
  findNode,
  findRange,
  getEventRange,
  getEventTransfer,
  setEventTransfer,
  AfterPlugin,
  BeforePlugin,
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_ELEMENT,
  NODE_TO_PARENT,
  EDITOR_TO_ELEMENT,
};

export default {
  Editor,
  cloneFragment,
  findDOMNode,
  findDOMRange,
  findNode,
  findRange,
  getEventRange,
  getEventTransfer,
  setEventTransfer,
  AfterPlugin,
  BeforePlugin,
  KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_ELEMENT,
  NODE_TO_PARENT,
  EDITOR_TO_ELEMENT,
};
