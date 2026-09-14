// Stand-in for native-only packages when Metro bundles for `web`.
//
// react-native-google-mobile-ads and react-native-iap both reach into
// react-native internals that react-native-web does not ship, so importing
// them breaks the *bundle*, not just the runtime — a try/catch around the
// require() cannot save it, because the failure happens at build time.
//
// Every call site already guards its require() with try/catch and falls back
// to mock mode (that is how the app survives Expo Go). Throwing here puts the
// web build on exactly that same path.
//
// Android and iOS never reach this file: metro.config.js only substitutes it
// when platform === 'web'.
throw new Error('native-only module is not available on web');
