module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transformIgnorePatterns: ["!node_modules/"],
  transform: {
    "^.+\\.jsx?$": require.resolve("babel-jest"),
    "^.+\\.tsx?$": "ts-jest",
  },
};
