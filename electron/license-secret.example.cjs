'use strict';

/**
 * Copy this file to electron/license-secret.cjs and replace the value,
 * or set COPYCRAFT_LICENSE_SECRET in the environment/CI secrets.
 * Generate with: openssl rand -hex 32
 */
module.exports = 'replace-with-a-64-hex-secret';
