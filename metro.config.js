// Expo default Metro config with ONE web-only override: react-native-pager-view
// is native-only (its web import crashes the whole web bundle at expo-router's
// route scan), so on web it resolves to an empty module. Web is a dev/QA
// vehicle only (v1 ships iOS); the three (main) pager screens don't render on
// the dev QA routes. Native (ios/android) resolution is untouched.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-pager-view') {
    return { type: 'empty' };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
