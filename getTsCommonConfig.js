'use strict';

const fs = require('fs');
const path = require('path');
const assign = require('object-assign');

module.exports = function () {
  let my = {};
  if (fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))) {
    my = require(path.join(process.cwd(), 'tsconfig.json'));
  }
  return assign({
    noUnusedParameters: false,
    noUnusedLocals: true,
    strictNullChecks: true,
    target: 'es5',
    jsx: 'preserve',
    moduleResolution: 'node',
    declaration: true,
    allowSyntheticDefaultImports: true,
    isolatedModules: true
  }, my.compilerOptions);
};
