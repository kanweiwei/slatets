/**
 * An auto-incrementing index for generating keys.
 *
 * @type {Number}
 */

let n: number;

/**
 * The global key generating function.
 *
 * @type {Function}
 */

let generate: () => string;

/**
 * Create a key, using a provided key if available.
 */

/**
 * Set a different unique ID generating `function`.
 */

function setGenerator(func: () => string): void {
  generate = func;
}

/**
 * Reset the key generating function to its initial state.
 */

function resetGenerator(): void {
  n = 0;
  generate = () => `${n++}`;
}

/**
 * Set the initial state.
 */

resetGenerator();

export { setGenerator, resetGenerator };

export default class Key {
  id: string;

  static create(key?: Key): Key {
    if (!key) {
      return new Key();
    }

    if (key instanceof Key) {
      return key;
    }

    throw new Error(`Key.create(args), args is ${key}`);
  }

  constructor() {
    this.id = generate();
  }
}
