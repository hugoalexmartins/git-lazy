const GitUtils = require('../utils/git');
const readline = require('readline');

/**
 * Git commit command implementation
 */
class CommitCommand {
  /**
   * Execute commit command with various options
   * @param {object} options - Commit options
   */
  static async execute(options = {}) {
    try {
      // Check if we're in a git repository
      if (!GitUtils.isGitRepository()) {
        throw new Error('Not in a git repository');
      }

      const {
        message,
        addAll = false,
        amend = false,
        noVerify = false,
        interactive = false,
        files = []
      } = options;

      // Handle interactive mode
      if (interactive || !message) {
        return await this.interactiveCommit(options);
      }

      // Add files if specified
      if (addAll) {
        console.log('📁 Staging all files...');
        GitUtils.addAllFiles();
      } else if (files.length > 0) {
        console.log(`📁 Staging files: ${files.join(', ')}`);
        GitUtils.addFiles(files);
      }

      // Check if there are staged changes
      const stagedFiles = GitUtils.getStagedFiles();
      if (stagedFiles.length === 0 && !amend) {
        console.log('⚠️  No changes staged for commit.');
        
        const unstagedFiles = GitUtils.getUnstagedFiles();
        if (unstagedFiles.length > 0) {
          console.log('\n📋 Unstaged changes:');
          unstagedFiles.forEach(file => console.log(`   ${file}`));
          console.log('\n💡 Use --add-all to stage all files, or specify files with --files');
        } else {
          console.log('💡 Working directory is clean.');
        }
        return;
      }

      // Show what will be committed
      if (stagedFiles.length > 0) {
        console.log('\n📋 Files to be committed:');
        stagedFiles.forEach(file => console.log(`   ✅ ${file}`));
      }

      // Perform the commit
      console.log(`\n💾 ${amend ? 'Amending' : 'Creating'} commit...`);
      
      GitUtils.commit(message, { amend, noVerify });
      
      console.log('✅ Commit successful!');
      
      // Show commit info
      const branch = GitUtils.getCurrentBranch();
      console.log(`📍 Branch: ${branch}`);
      console.log(`📝 Message: ${message}`);

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Interactive commit mode
   * @param {object} baseOptions - Base options for the commit
   */
  static async interactiveCommit(baseOptions = {}) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Show current status
      this.showStatus();

      // Check if there are unstaged files and ask to stage them
      const unstagedFiles = GitUtils.getUnstagedFiles();
      if (unstagedFiles.length > 0) {
        const stageAll = await this.askQuestion(rl, '\n📁 Stage all files? (y/N): ');
        if (stageAll.toLowerCase().startsWith('y')) {
          GitUtils.addAllFiles();
          console.log('✅ All files staged.');
        } else {
          const stageSome = await this.askQuestion(rl, '📁 Stage specific files? (y/N): ');
          if (stageSome.toLowerCase().startsWith('y')) {
            console.log('\n📋 Available files:');
            unstagedFiles.forEach((file, index) => {
              console.log(`   ${index + 1}. ${file}`);
            });
            
            const indices = await this.askQuestion(rl, '\nEnter file numbers (comma-separated): ');
            const selectedIndices = indices.split(',').map(i => parseInt(i.trim()) - 1);
            const selectedFiles = selectedIndices
              .filter(i => i >= 0 && i < unstagedFiles.length)
              .map(i => unstagedFiles[i]);
            
            if (selectedFiles.length > 0) {
              GitUtils.addFiles(selectedFiles);
              console.log(`✅ Staged: ${selectedFiles.join(', ')}`);
            }
          }
        }
      }

      // Check staged files again
      const stagedFiles = GitUtils.getStagedFiles();
      if (stagedFiles.length === 0 && !baseOptions.amend) {
        console.log('⚠️  No files staged for commit.');
        rl.close();
        return;
      }

      // Get commit message
      let commitMessage = baseOptions.message;
      if (!commitMessage) {
        commitMessage = await this.askQuestion(rl, '\n📝 Enter commit message: ');
        if (!commitMessage.trim()) {
          console.log('❌ Commit message cannot be empty.');
          rl.close();
          return;
        }
      }

      // Ask about amend if not specified
      let amend = baseOptions.amend;
      if (amend === undefined && GitUtils.hasCommits()) {
        const amendResponse = await this.askQuestion(rl, '🔄 Amend previous commit? (y/N): ');
        amend = amendResponse.toLowerCase().startsWith('y');
      }

      // Ask about verification
      let noVerify = baseOptions.noVerify;
      if (noVerify === undefined) {
        const verifyResponse = await this.askQuestion(rl, '🔍 Skip pre-commit hooks? (y/N): ');
        noVerify = verifyResponse.toLowerCase().startsWith('y');
      }

      rl.close();

      // Execute the commit
      await this.execute({
        message: commitMessage,
        amend,
        noVerify,
        interactive: false
      });

    } catch (error) {
      rl.close();
      throw error;
    }
  }

  /**
   * Show current git status in a user-friendly format
   */
  static showStatus() {
    console.log('📊 Current Status:');
    
    const branch = GitUtils.getCurrentBranch();
    console.log(`📍 Branch: ${branch}`);

    const stagedFiles = GitUtils.getStagedFiles();
    const unstagedFiles = GitUtils.getUnstagedFiles();

    if (stagedFiles.length > 0) {
      console.log('\n✅ Staged files:');
      stagedFiles.forEach(file => console.log(`   ${file}`));
    }

    if (unstagedFiles.length > 0) {
      console.log('\n📝 Unstaged changes:');
      unstagedFiles.forEach(file => console.log(`   ${file}`));
    }

    if (stagedFiles.length === 0 && unstagedFiles.length === 0) {
      console.log('✨ Working directory is clean.');
    }
  }

  /**
   * Helper to ask questions in interactive mode
   * @param {readline.Interface} rl - Readline interface
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User's answer
   */
  static askQuestion(rl, question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Display help information for commit command
   */
  static showHelp() {
    console.log(`
🚀 git-lazy commit - Simplified git commit interface

Usage:
  git-lazy commit [options]

Options:
  -m, --message <msg>     Commit message
  -a, --add-all          Stage all files before committing
  -f, --files <files>    Comma-separated list of files to stage
  --amend                Amend the previous commit
  --no-verify            Skip pre-commit hooks
  -i, --interactive      Interactive commit mode
  -h, --help             Show this help message

Examples:
  git-lazy commit -m "Fix bug in user authentication"
  git-lazy commit -a -m "Update documentation"
  git-lazy commit --interactive
  git-lazy commit --amend -m "Fix typo in previous commit"
  git-lazy commit -f "src/index.js,README.md" -m "Update main files"

Interactive Mode:
  When no message is provided or -i flag is used, git-lazy will enter
  interactive mode to guide you through the commit process.
`);
  }
}

module.exports = CommitCommand;