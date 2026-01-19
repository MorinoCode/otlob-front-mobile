module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // این خط برای جلوگیری از کرش نویگیشن حیاتی است
      'react-native-reanimated/plugin',
    ],
  };
};