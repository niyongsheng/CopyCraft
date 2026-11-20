'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Localized macOS display names. CFBundleName drives the application menu;
// CFBundleDisplayName drives Finder, Dock and the app switcher.
const DISPLAY_NAMES = {
  en: 'Copy Craft',
  'zh-Hans': '字帖工坊',
  'zh-Hant': '字帖工坊',
  ja: 'Copy Craft',
  ko: 'Copy Craft',
};

exports.afterPack = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const resourcesDir = path.join(context.appOutDir, appName, 'Contents', 'Resources');
  if (!fs.existsSync(resourcesDir)) {
    throw new Error(`[after-pack] macOS Resources directory not found: ${resourcesDir}`);
  }

  for (const [locale, displayName] of Object.entries(DISPLAY_NAMES)) {
    const lprojDir = path.join(resourcesDir, `${locale}.lproj`);
    fs.mkdirSync(lprojDir, { recursive: true });
    fs.writeFileSync(
      path.join(lprojDir, 'InfoPlist.strings'),
      `"CFBundleDisplayName" = "${displayName}";\n"CFBundleName" = "${displayName}";\n`,
      'utf8',
    );
  }
};
