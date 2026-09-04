module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-includes the react-native-reanimated/plugin.
    presets: ['babel-preset-expo'],
  };
};
