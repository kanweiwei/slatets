/**
 * 自增索引
 * @type {Number}
 */
let n: number;

/**
 * 全局的key生成函数
 *
 * @type {Function}
 */
let generate: () => string;

/**
 * 生成一个key
 *
 * @return {String}
 */
function generateKey(): string {
    return generate();
}

/**
 *  自定义唯一key生成函数
 *
 * @param {Function} func
 */
function setKeyGenerator(func): void {
    generate = func;
}

/**
 * 重置key
 */
function resetKeyGenerator(): void {
    n = 0;
    generate = () => `${n++}`;
}

/**
 * 初始化
 */
resetKeyGenerator();

export default generateKey;
export { setKeyGenerator, resetKeyGenerator };
