#!/usr/bin/env node

/**
 * git-lazy - A Node.js utility for git operations
 */

const CommitCommand = require('./commands/commit');

function parseArguments(args) {
  const options = {
    command: null,
    message: null,
    addAll: false,
    amend: false,
    noVerify: false,
    interactive: false,
    files: [],
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
    case 'commit':
      options.command = 'commit';
      break;
    case '-m':
    case '--message':
      options.message = args[++i];
      break;
    case '-a':
    case '--add-all':
      options.addAll = true;
      break;
    case '-f':
    case '--files':
      options.files = args[++i] ? args[i].split(',').map(f => f.trim()) : [];
      break;
    case '--amend':
      options.amend = true;
      break;
    case '--no-verify':
      options.noVerify = true;
      break;
    case '-i':
    case '--interactive':
      options.interactive = true;
      break;
    case '-h':
    case '--help':
      options.help = true;
      break;
    }
  }

  return options;
}

function showGeneralHelp() {
  console.log(`
🚀 git-lazy - A utility tool for simplifying common git operations

Usage:
  git-lazy <command> [options]

Commands:
  commit                 Create a git commit with enhanced interface

Global Options:
  -h, --help            Show help information

Examples:
  git-lazy commit -m "Add new feature"
  git-lazy commit --interactive
  git-lazy commit --help

For command-specific help, use:
  git-lazy <command> --help
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showGeneralHelp();
    return;
  }

  const options = parseArguments(args);

  // Handle global help
  if (options.help && !options.command) {
    showGeneralHelp();
    return;
  }

  // Route to appropriate command
  switch (options.command) {
  case 'commit':
    if (options.help) {
      CommitCommand.showHelp();
    } else {
      await CommitCommand.execute(options);
    }
    break;
    
  default:
    if (args[0] && !args[0].startsWith('-')) {
      console.error(`❌ Unknown command: ${args[0]}`);
      console.log('\nRun "git-lazy --help" to see available commands.');
      throw new Error(`Unknown command: ${args[0]}`);
    } else {
      showGeneralHelp();
    }
    break;
  }
}

// Execute main function if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  });
}

// Export main function for use as a module
module.exports = main;
