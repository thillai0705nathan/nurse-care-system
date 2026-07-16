/**
 * Builds the www/ folder for each Capacitor app (apk-admin, apk-member)
 * by copying that app's source folder plus the shared common/api-client.js,
 * flattened into one directory (Capacitor only bundles the webDir it's
 * pointed at, so ../common/ references from the source folders won't
 * resolve once packaged — this script inlines common/ and rewrites the
 * script src to match).
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rewriteCommonPath(wwwDir) {
  for (const file of fs.readdirSync(wwwDir)) {
    if (!file.endsWith('.html')) continue;
    const filePath = path.join(wwwDir, file);
    let text = fs.readFileSync(filePath, 'utf8');
    if (text.includes('../common/api-client.js')) {
      text = text.split('../common/api-client.js').join('api-client.js');
      fs.writeFileSync(filePath, text);
    }
  }
}

function buildApp(sourceDirName, apkDirName) {
  const sourceDir = path.join(ROOT, sourceDirName);
  const wwwDir = path.join(ROOT, apkDirName, 'www');

  copyDir(sourceDir, wwwDir);
  fs.copyFileSync(path.join(ROOT, 'common', 'api-client.js'), path.join(wwwDir, 'api-client.js'));
  rewriteCommonPath(wwwDir);

  console.log(`Built ${apkDirName}/www from ${sourceDirName}/ + common/api-client.js`);
}

buildApp('admin', 'apk-admin');
buildApp('member', 'apk-member');
