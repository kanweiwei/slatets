import Debug from "debug";
import isPlainObject from "is-plain-object";
import { List, Record, Stack } from "immutable";

import MODEL_TYPES from "../constants/model-types";
import Operation from "./operation";

const debug = Debug("slate:history");

const DEFAULTS = {
  redos: Stack(),
  undos: Stack(),
};

class History extends Record(DEFAULTS) {
  public redos: Stack<List<Operation>>;
  public undos: Stack<List<Operation>>;

  // Create a new `History` with `attrs`.
  static create(attrs: any | History = {}) {
    if (History.isHistory(attrs)) {
      return attrs;
    }

    if (isPlainObject(attrs)) {
      return History.fromJSON(attrs);
    }

    throw new Error(
      `\`History.create\` only accepts objects or histories, but you passed it: ${attrs}`
    );
  }

  // Create a list of `Operations` from `operations`.
  static createOperationsList(operations: any[] | List<any> = []) {
    if (List.isList(operations)) {
      return operations;
    }

    if (Array.isArray(operations)) {
      return List(operations);
    }

    throw new Error(
      `\`History.createList\` only accepts arrays or lists, but you passed it: ${operations}`
    );
  }

  // Create a `History` from a JSON `object`.
  static fromJSON(object: any) {
    const { redos = [], undos = [] } = object;

    const history = new History({
      redos: Stack(redos.map(this.createOperationsList)),
      undos: Stack(undos.map(this.createOperationsList)),
    });

    return history;
  }

  static isHistory(obj: any) {
    return !!(obj && obj[MODEL_TYPES.HISTORY]);
  }

  get object() {
    return "history";
  }

  // Save an `operation` into the history.
  save(operation: any, options: any = {}) {
    let history = this as History;
    let { undos, redos } = history;
    let { merge, skip } = options;
    const prevBatch = undos.peek();
    const prevOperation = prevBatch && prevBatch.last();

    if (skip) {
      return history;
    }

    if (merge == null) {
      merge = shouldMerge(operation, prevOperation);
    }

    debug("save", { operation, merge });

    // If the `merge` flag is true, add the operation to the previous batch.
    if (merge && prevBatch) {
      const batch = prevBatch.push(operation);
      undos = undos.pop();
      undos = undos.push(batch);
    } else {
      // Otherwise, create a new batch with the operation.
      const batch = List([operation]);
      undos = undos.push(batch);
    }

    // Constrain the history to 100 entries for memory's sake.
    if (undos.size > 100) {
      undos = undos.take(100).toStack();
    }

    // Clear the redos and update the history.
    redos = redos.clear();
    history = history.set("undos", undos).set("redos", redos) as History;
    return history;
  }

  // Return a JSON representation of the history.
  toJSON() {
    const object = {
      object: this.object,
      redos: (this.redos as any).toJSON(),
      undos: (this.undos as any).toJSON(),
    };

    return object;
  }
}

// Check whether to merge a new operation `o` into the previous operation `p`.
function shouldMerge(o: any, p: any) {
  if (!p) return false;

  const merge =
    (o.type == "set_selection" && p.type == "set_selection") ||
    (o.type == "insert_text" &&
      p.type == "insert_text" &&
      o.offset == p.offset + p.text.length &&
      o.path.equals(p.path)) ||
    (o.type == "remove_text" &&
      p.type == "remove_text" &&
      o.offset + o.text.length == p.offset &&
      o.path.equals(p.path));

  return merge;
}

History.prototype[MODEL_TYPES.HISTORY] = true;

export default History;
