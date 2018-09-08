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

function create(key?: string): string {
    if (!key) {
        return generate();
    }

    if (typeof key === "string") {
        return key;
    }

    throw new Error(`Keys must be strings, but you passed: ${key}`);
}

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

/**
 * Export.
 *
 * @type {Object}
 */

export default {
    create,
    setGenerator,
    resetGenerator
};
