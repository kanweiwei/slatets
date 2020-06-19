"use strict";

module.exports = function (modules) {
  const plugins = [
    // require.resolve('babel-plugin-add-module-exports'),
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-object-rest-spread",
    ["@babel/plugin-transform-runtime", { builtins: "usage", corejs: 3 }],
  ];
  return {
    presets: ["@babel/preset-react", "@babel/preset-typescript"],
    plugins,
  };
};
