#!/usr/bin/env node

/**
 * Build script for git-lazy
 *
 * This script performs the build process for the git-lazy package:
 * 1. Cleans the dist directory
 * 2. Bundles the JavaScript files
 * 3. Copies necessary files to the dist directory
 * 4. Makes the main executable file executable
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Create dist directory if it doesn't exist
console.log('Creating dist directory...');
if (fs.existsSync(DIST_DIR)) {
  console.log('Cleaning dist directory...');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Copy index.js to dist
console.log('Copying main index.js...');
fs.copyFileSync(path.join(ROOT_DIR, 'index.js'), path.join(DIST_DIR, 'index.js'));

// Copy source files
console.log('Copying source files...');
copyDir(SRC_DIR, path.join(DIST_DIR, 'src'));

// Copy package files
console.log('Copying package files...');
['package.json', 'README.md', 'LICENSE'].forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, path.join(DIST_DIR, file));
  }
});

// Make executable
console.log('Making index.js executable...');
try {
  execSync(`chmod +x "${path.join(DIST_DIR, 'index.js')}"`);
} catch (err) {
  console.warn('Could not make index.js executable. This may cause issues on Unix systems.');
  console.warn(err.message);
}

console.log('Build completed successfully!');

/**
 * Recursively copy a directory
 * @param {string} src Source directory
 * @param {string} dest Destination directory
 */
function copyDir(src, dest) {
  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  // Get all files in source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Copy each file/directory
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
