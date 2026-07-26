const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// حل مشكلة التوجيه الوهمي لـ expo/virtual/env
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo/virtual/env': require.resolve('expo-constants'),
};

module.exports = config;