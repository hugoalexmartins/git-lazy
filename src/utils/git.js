const { execSync, exec } = require('child_process');

/**
 * Git utilities for executing git commands safely
 */
class GitUtils {
  /**
   * Check if current directory is a git repository
   * @returns {boolean} True if in a git repository
   */
  static isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute a git command synchronously
   * @param {string} command - Git command to execute
   * @param {object} options - Execution options
   * @returns {string} Command output
   */
  static execGitSync(command, options = {}) {
    if (!this.isGitRepository()) {
      throw new Error('Not in a git repository');
    }

    try {
      const result = execSync(`git ${command}`, {
        encoding: 'utf8',
        ...options
      });
      return result.toString().trim();
    } catch (error) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  /**
   * Execute a git command asynchronously
   * @param {string} command - Git command to execute
   * @param {object} options - Execution options
   * @returns {Promise<string>} Command output
   */
  static execGitAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isGitRepository()) {
        reject(new Error('Not in a git repository'));
        return;
      }

      exec(`git ${command}`, {
        encoding: 'utf8',
        ...options
      }, (error, stdout) => {
        if (error) {
          reject(new Error(`Git command failed: ${error.message}`));
        } else {
          resolve(stdout.toString().trim());
        }
      });
    });
  }

  /**
   * Get current git status
   * @returns {string} Git status output
   */
  static getStatus() {
    return this.execGitSync('status --porcelain');
  }

  /**
   * Get current branch name
   * @returns {string} Current branch name
   */
  static getCurrentBranch() {
    return this.execGitSync('rev-parse --abbrev-ref HEAD');
  }

  /**
   * Check if working directory is clean
   * @returns {boolean} True if working directory is clean
   */
  static isWorkingDirectoryClean() {
    const status = this.getStatus();
    return status.length === 0;
  }

  /**
   * Get staged files
   * @returns {string[]} Array of staged file paths
   */
  static getStagedFiles() {
    const status = this.getStatus();
    return status
      .split('\n')
      .filter(line => line.length >= 3 && (line[0] === 'A' || line[0] === 'M' || line[0] === 'D' || line[0] === 'R' || line[0] === 'C'))
      .map(line => line.substring(3));
  }

  /**
   * Get unstaged files
   * @returns {string[]} Array of unstaged file paths
   */
  static getUnstagedFiles() {
    const status = this.getStatus();
    return status
      .split('\n')
      .filter(line => {
        if (line.length < 3) return false;
        if (line.startsWith('??')) return true;
        if (line[1] === 'M' || line[1] === 'D') return true;
        return false;
      })
      .map(line => line.substring(3));
  }

  /**
   * Stage files for commit
   * @param {string|string[]} files - File(s) to stage
   */
  static addFiles(files) {
    const fileList = Array.isArray(files) ? files : [files];
    const escapedFiles = fileList.map(file => `"${file}"`).join(' ');
    this.execGitSync(`add ${escapedFiles}`);
  }

  /**
   * Stage all files
   */
  static addAllFiles() {
    this.execGitSync('add .');
  }

  /**
   * Create a commit
   * @param {string} message - Commit message
   * @param {object} options - Commit options
   */
  static commit(message, options = {}) {
    const { amend = false, noVerify = false } = options;
    
    let command = 'commit';
    
    if (amend) {
      command += ' --amend';
    }
    
    if (noVerify) {
      command += ' --no-verify';
    }
    
    command += ` -m "${message.replace(/"/g, '\\"')}"`;
    
    return this.execGitSync(command);
  }

  /**
   * Get the last commit message
   * @returns {string} Last commit message
   */
  static getLastCommitMessage() {
    return this.execGitSync('log -1 --pretty=%B');
  }

  /**
   * Check if there are any commits in the repository
   * @returns {boolean} True if repository has commits
   */
  static hasCommits() {
    try {
      this.execGitSync('rev-parse HEAD');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = GitUtils;