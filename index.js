#!/usr/bin/env node

/**
 * git-lazy
 * 
 * A utility tool for simplifying common git operations
 */

// Import the main function from the src directory
const main = require('./src/index');

// Export the main function for use as a module
module.exports = main;

// Execute main function if this file is run directly
if (require.main === module) {
  main();
}