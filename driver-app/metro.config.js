// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// socket.io-client uses Node.js built-ins (net, tls, etc.) for its XHR
// transport. In React Native we always use the WebSocket transport, so we
// stub out the Node-only modules so Metro doesn't choke on them.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  net: require.resolve('./shims/empty.js'),
  tls: require.resolve('./shims/empty.js'),
  fs: require.resolve('./shims/empty.js'),
  dns: require.resolve('./shims/empty.js'),
  dgram: require.resolve('./shims/empty.js'),
};

module.exports = config;
