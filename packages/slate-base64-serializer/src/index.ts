import { Node, Value } from '@zykj/slate'
import { atob, btoa } from 'isomorphic-base64'

/**
 * Encode a JSON `object` as base-64 `string`.
 *
 * @param {Object} object
 */

function encode(object) {
  const string = JSON.stringify(object)
  const encoded = btoa(encodeURIComponent(string))
  return encoded
}

/**
 * Decode a base-64 `string` to a JSON `object`.
 *
 * @param {String} string
 */

function decode(string) {
  const decoded = decodeURIComponent(atob(string))
  const object = JSON.parse(decoded)
  return object
}

/**
 * Deserialize a Value `string`.
 *
 * @param {String} string
 */

function deserialize(string, options: any = {}) {
  const raw = decode(string)
  const value = Value.fromJSON(raw, options)
  return value
}

/**
 * Deserialize a Node `string`.
 *
 * @param {String} string
 */

function deserializeNode(string, options: any = {}) {
  const raw = decode(string)
  const node = Node.fromJSON(raw, options)
  return node
}

/**
 * Serialize a `value`.
 *
 * @param {Value} value
 */

function serialize(value, options) {
  const raw = value.toJSON(options)
  const encoded = encode(raw)
  return encoded
}

/**
 * Serialize a `node`.
 *
 * @param {Node} node
 */

function serializeNode(node, options: any = {}) {
  const raw = node.toJSON(options)
  const encoded = encode(raw)
  return encoded
}

/**
 * Export.
 *
 * @type {Object}
 */

export default {
  deserialize,
  deserializeNode,
  serialize,
  serializeNode,
}
