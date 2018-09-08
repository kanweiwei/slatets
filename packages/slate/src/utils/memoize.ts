// 是否启用存储
let ENABLED: boolean = true;
// 更改该值，将导致清空之前所有的缓存结果
let CACHE_KEY: number = 0;
// 一个缓存树的叶节点
const LEAF: any = {};

const UNDEFINED: {} = {};

const UNSET: undefined = void 0;

function memoize(object: any, properties: any[]) {
    for (const property of properties) {
        const original = object[property];

        if (!original) {
            throw new Error(
                `Object does not have a property named "${property}".`
            );
        }

        object[property] = function(...args) {
            // If memoization is disabled, call into the original method.
            if (!ENABLED) return original.apply(this, args);

            // If the cache key is different, previous caches must be cleared.
            if (CACHE_KEY !== this.__cache_key) {
                this.__cache_key = CACHE_KEY;
                this.__cache = new Map(); // eslint-disable-line no-undef,no-restricted-globals
                this.__cache_no_args = {};
            }

            if (!this.__cache) {
                this.__cache = new Map(); // eslint-disable-line no-undef,no-restricted-globals
            }

            if (!this.__cache_no_args) {
                this.__cache_no_args = {};
            }

            const takesArguments = args.length !== 0;

            let cachedValue;
            let keys;

            if (takesArguments) {
                keys = [property, ...args];
                cachedValue = getIn(this.__cache, keys);
            } else {
                cachedValue = this.__cache_no_args[property];
            }

            // If we've got a result already, return it.
            if (cachedValue !== UNSET) {
                return cachedValue === UNDEFINED ? void 0 : cachedValue;
            }

            // Otherwise calculate what it should be once and cache it.
            const value = original.apply(this, args);
            const v = value === void 0 ? UNDEFINED : value;

            if (takesArguments) {
                this.__cache = setIn(this.__cache, keys, v);
            } else {
                this.__cache_no_args[property] = v;
            }

            return value;
        };
    }
}

function getIn(map: Map<any, any>, keys: any[]): undefined | any {
    for (const key of keys) {
        map = map.get(key);
        if (map === UNSET) return UNSET;
    }

    return map.get(LEAF);
}

function setIn(map: Map<any, any>, keys: any[], value: any): Map<any, any> {
    let parent = map;
    let child;

    for (const key of keys) {
        child = parent.get(key);

        // If the path was not created yet...
        if (child === UNSET) {
            child = new Map(); // eslint-disable-line no-undef,no-restricted-globals
            parent.set(key, child);
        }

        parent = child;
    }

    // The whole path has been created, so set the value to the bottom most map.
    child.set(LEAF, value);
    return map;
}

function resetMemoization() {
    CACHE_KEY++;

    if (CACHE_KEY >= Number.MAX_SAFE_INTEGER) {
        CACHE_KEY = 0;
    }
}

function useMemoization(enabled: boolean): void {
    ENABLED = enabled;
}

export { resetMemoization, useMemoization };

export default memoize;
