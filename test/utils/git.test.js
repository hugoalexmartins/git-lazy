/**
 * Tests for GitUtils module
 */

const GitUtils = require('../../src/utils/git');
const { execSync } = require('child_process');

// Mock child_process
jest.mock('child_process');

describe('GitUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repository', () => {
      execSync.mockReturnValue('');

      const result = GitUtils.isGitRepository();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git rev-parse --git-dir', { stdio: 'ignore' });
    });

    it('should return false when not in a git repository', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = GitUtils.isGitRepository();

      expect(result).toBe(false);
    });
  });

  describe('execGitSync', () => {
    it('should execute git command successfully', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('command output');

      const result = GitUtils.execGitSync('status');

      expect(result).toBe('command output');
      expect(execSync).toHaveBeenCalledWith('git status', { encoding: 'utf8' });
    });

    it('should throw error when not in git repository', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      expect(() => GitUtils.execGitSync('status')).toThrow('Not in a git repository');
    });

    it('should throw error when git command fails', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('status')) {
          throw new Error('Command failed');
        }
        return '';
      });

      expect(() => GitUtils.execGitSync('status')).toThrow('Git command failed: Command failed');
    });
  });

  describe('getStatus', () => {
    it('should return git status output', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('M  file1.js\nA  file2.js');

      const result = GitUtils.getStatus();

      expect(result).toBe('M  file1.js\nA  file2.js');
      expect(execSync).toHaveBeenCalledWith('git status --porcelain', { encoding: 'utf8' });
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('main');

      const result = GitUtils.getCurrentBranch();

      expect(result).toBe('main');
      expect(execSync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' });
    });
  });

  describe('isWorkingDirectoryClean', () => {
    it('should return true when working directory is clean', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce(''); // for getStatus

      const result = GitUtils.isWorkingDirectoryClean();

      expect(result).toBe(true);
    });

    it('should return false when working directory has changes', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('M  file1.js'); // for getStatus

      const result = GitUtils.isWorkingDirectoryClean();

      expect(result).toBe(false);
    });
  });

  describe('getStagedFiles', () => {
    it('should return array of staged files', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('M  src/index.js\nA  src/new.js\n?? untracked.js');

      const result = GitUtils.getStagedFiles();

      expect(result).toEqual(['src/index.js', 'src/new.js']);
    });

    it('should return empty array when no files are staged', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce(''); // for getStatus

      const result = GitUtils.getStagedFiles();

      expect(result).toEqual([]);
    });
  });

  describe('getUnstagedFiles', () => {
    it('should return array of unstaged files', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('M  src/staged.js\n M src/unstaged.js\n?? untracked.js');

      const result = GitUtils.getUnstagedFiles();

      expect(result).toEqual(['src/unstaged.js', 'untracked.js']);
    });

    it('should return empty array when no unstaged files', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('M  src/staged.js\nA  src/added.js');

      const result = GitUtils.getUnstagedFiles();

      expect(result).toEqual([]);
    });
  });

  describe('addFiles', () => {
    it('should stage single file', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('');

      GitUtils.addFiles('file1.js');

      expect(execSync).toHaveBeenCalledWith('git add "file1.js"', { encoding: 'utf8' });
    });

    it('should stage multiple files', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('');

      GitUtils.addFiles(['file1.js', 'file2.js']);

      expect(execSync).toHaveBeenCalledWith('git add "file1.js" "file2.js"', { encoding: 'utf8' });
    });
  });

  describe('addAllFiles', () => {
    it('should stage all files', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('');

      GitUtils.addAllFiles();

      expect(execSync).toHaveBeenCalledWith('git add .', { encoding: 'utf8' });
    });
  });

  describe('commit', () => {
    it('should create a commit with message', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('[main abc1234] Test commit');

      const result = GitUtils.commit('Test commit');

      expect(result).toBe('[main abc1234] Test commit');
      expect(execSync).toHaveBeenCalledWith('git commit -m "Test commit"', { encoding: 'utf8' });
    });

    it('should create an amended commit', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('[main abc1234] Test commit');

      GitUtils.commit('Test commit', { amend: true });

      expect(execSync).toHaveBeenCalledWith('git commit --amend -m "Test commit"', { encoding: 'utf8' });
    });

    it('should skip verification when requested', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('[main abc1234] Test commit');

      GitUtils.commit('Test commit', { noVerify: true });

      expect(execSync).toHaveBeenCalledWith('git commit --no-verify -m "Test commit"', { encoding: 'utf8' });
    });

    it('should escape quotes in commit message', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('[main abc1234] Test commit');

      GitUtils.commit('Fix "bug" in code');

      expect(execSync).toHaveBeenCalledWith('git commit -m "Fix \\"bug\\" in code"', { encoding: 'utf8' });
    });
  });

  describe('getLastCommitMessage', () => {
    it('should return last commit message', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('Last commit message');

      const result = GitUtils.getLastCommitMessage();

      expect(result).toBe('Last commit message');
      expect(execSync).toHaveBeenCalledWith('git log -1 --pretty=%B', { encoding: 'utf8' });
    });
  });

  describe('hasCommits', () => {
    it('should return true when repository has commits', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockReturnValueOnce('abc1234');

      const result = GitUtils.hasCommits();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git rev-parse HEAD', { encoding: 'utf8' });
    });

    it('should return false when repository has no commits', () => {
      execSync.mockReturnValueOnce(''); // for isGitRepository check
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('rev-parse HEAD')) {
          throw new Error('bad revision');
        }
        return '';
      });

      const result = GitUtils.hasCommits();

      expect(result).toBe(false);
    });
  });
});
