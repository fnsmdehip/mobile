const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Include markdown, tex, and pdf as assets so we can bundle them locally
config.resolver.assetExts.push('md', 'tex', 'pdf');

module.exports = config; 