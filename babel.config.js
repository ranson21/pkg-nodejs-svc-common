module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ];

  const plugins = [
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-transform-runtime",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
  ];

  return {
    presets,
    plugins,
  };
};
