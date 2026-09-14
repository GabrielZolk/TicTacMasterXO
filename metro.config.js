// Metro config — exists so the app can be bundled for `web` and driven in a
// browser for testing. Native builds are unaffected: the substitution below is
// gated on platform === 'web'.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Packages that only exist as native modules. See web-stubs/native-only.js.
const NATIVE_ONLY = new Set([
    'react-native-google-mobile-ads',
    'react-native-iap',
]);

// react-native-web's Alert is an empty stub, so every dialog is invisible in the
// browser. Swap in a real one for web only. See web-stubs/alert-web.js.
const alertStub = path.resolve(__dirname, 'web-stubs/alert-web.js');
// babel-plugin-react-native-web rewrites `import { Alert } from 'react-native'`
// into a deep import, so match both the deep path and the barrel re-export.
const isAlertModule = (name) => name === './exports/Alert'
    || name.split(path.sep).join('/').endsWith('react-native-web/dist/exports/Alert');

const nativeOnlyStub = path.resolve(__dirname, 'web-stubs/native-only.js');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && isAlertModule(moduleName)) {
        return { type: 'sourceFile', filePath: alertStub };
    }
    if (platform === 'web' && NATIVE_ONLY.has(moduleName)) {
        return { type: 'sourceFile', filePath: nativeOnlyStub };
    }
    return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
