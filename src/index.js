#!/usr/bin/env node

/**
 * git-lazy - A Node.js utility for git operations
 */

function main() {
  console.log('Hello from git-lazy!');
  console.log('This is a Node.js utility for git operations.');
}

// Execute main function if this file is run directly
if (require.main === module) {
  main();
}

// Export main function for use as a module
module.exports = main;