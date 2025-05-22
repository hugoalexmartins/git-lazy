/**
 * Tests for CommitCommand module
 */

const CommitCommand = require('../../src/commands/commit');
const GitUtils = require('../../src/utils/git');
const readline = require('readline');

// Mock dependencies
jest.mock('../../src/utils/git');
jest.mock('readline');

describe('CommitCommand', () => {
  let mockConsoleLog;
  let mockConsoleError;
  let mockProcessExit;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('execute', () => {
    beforeEach(() => {
      GitUtils.isGitRepository.mockReturnValue(true);
      GitUtils.getStagedFiles.mockReturnValue(['file1.js']);
      GitUtils.getUnstagedFiles.mockReturnValue([]);
      GitUtils.getCurrentBranch.mockReturnValue('main');
      GitUtils.commit.mockReturnValue('[main abc1234] Test commit');
    });

    it('should execute a simple commit successfully', async () => {
      const options = {
        message: 'Test commit message'
      };

      await CommitCommand.execute(options);

      expect(GitUtils.commit).toHaveBeenCalledWith('Test commit message', {
        amend: false,
        noVerify: false
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Commit successful!');
    });

    it('should stage all files when addAll is true', async () => {
      const options = {
        message: 'Test commit',
        addAll: true
      };

      await CommitCommand.execute(options);

      expect(GitUtils.addAllFiles).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('📁 Staging all files...');
    });

    it('should stage specific files when files array is provided', async () => {
      const options = {
        message: 'Test commit',
        files: ['file1.js', 'file2.js']
      };

      await CommitCommand.execute(options);

      expect(GitUtils.addFiles).toHaveBeenCalledWith(['file1.js', 'file2.js']);
      expect(mockConsoleLog).toHaveBeenCalledWith('📁 Staging files: file1.js, file2.js');
    });

    it('should handle amend option', async () => {
      const options = {
        message: 'Amended commit',
        amend: true
      };

      await CommitCommand.execute(options);

      expect(GitUtils.commit).toHaveBeenCalledWith('Amended commit', {
        amend: true,
        noVerify: false
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('\n💾 Amending commit...');
    });

    it('should handle noVerify option', async () => {
      const options = {
        message: 'Test commit',
        noVerify: true
      };

      await CommitCommand.execute(options);

      expect(GitUtils.commit).toHaveBeenCalledWith('Test commit', {
        amend: false,
        noVerify: true
      });
    });

    it('should exit with error when not in git repository', async () => {
      GitUtils.isGitRepository.mockReturnValue(false);

      const options = { message: 'Test commit' };

      await expect(CommitCommand.execute(options)).rejects.toThrow('Not in a git repository');
    });

    it('should warn when no changes are staged', async () => {
      GitUtils.getStagedFiles.mockReturnValue([]);
      GitUtils.getUnstagedFiles.mockReturnValue(['unstaged.js']);

      const options = { message: 'Test commit' };

      await CommitCommand.execute(options);

      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  No changes staged for commit.');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n📋 Unstaged changes:');
      expect(GitUtils.commit).not.toHaveBeenCalled();
    });

    it('should show clean directory message when no changes', async () => {
      GitUtils.getStagedFiles.mockReturnValue([]);
      GitUtils.getUnstagedFiles.mockReturnValue([]);

      const options = { message: 'Test commit' };

      await CommitCommand.execute(options);

      expect(mockConsoleLog).toHaveBeenCalledWith('💡 Working directory is clean.');
    });

    it('should handle git command errors', async () => {
      GitUtils.commit.mockImplementation(() => {
        throw new Error('Git command failed');
      });

      const options = { message: 'Test commit' };

      await expect(CommitCommand.execute(options)).rejects.toThrow('Git command failed');
    });
  });

  describe('interactiveCommit', () => {
    let mockRl;

    beforeEach(() => {
      mockRl = {
        question: jest.fn(),
        close: jest.fn()
      };
      readline.createInterface.mockReturnValue(mockRl);
      
      GitUtils.isGitRepository.mockReturnValue(true);
      GitUtils.getCurrentBranch.mockReturnValue('main');
      GitUtils.getStagedFiles.mockReturnValue([]);
      GitUtils.getUnstagedFiles.mockReturnValue(['file1.js']);
      GitUtils.hasCommits.mockReturnValue(true);
    });

    it('should handle interactive commit flow', async () => {
      // Mock user responses
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n')) // Don't stage all
        .mockImplementationOnce((question, callback) => callback('n')) // Don't stage specific
        .mockImplementationOnce((question, callback) => callback('Test commit message')) // Commit message
        .mockImplementationOnce((question, callback) => callback('n')) // Don't amend
        .mockImplementationOnce((question, callback) => callback('n')); // Don't skip hooks

      GitUtils.getStagedFiles.mockReturnValueOnce([]).mockReturnValueOnce(['file1.js']);
      GitUtils.commit.mockReturnValue('[main abc1234] Test commit');

      const spy = jest.spyOn(CommitCommand, 'execute').mockResolvedValue();

      await CommitCommand.interactiveCommit();

      expect(spy).toHaveBeenCalledWith({
        message: 'Test commit message',
        amend: false,
        noVerify: false,
        interactive: false
      });

      spy.mockRestore();
    });

    it('should stage all files when user confirms', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y')) // Stage all files
        .mockImplementationOnce((question, callback) => callback('Test message'))
        .mockImplementationOnce((question, callback) => callback('n'))
        .mockImplementationOnce((question, callback) => callback('n'));

      GitUtils.getStagedFiles.mockReturnValueOnce([]).mockReturnValueOnce(['file1.js']);
      
      const spy = jest.spyOn(CommitCommand, 'execute').mockResolvedValue();

      await CommitCommand.interactiveCommit();

      expect(GitUtils.addAllFiles).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ All files staged.');

      spy.mockRestore();
    });

    it('should exit when no commit message provided', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n')) // Don't stage all
        .mockImplementationOnce((question, callback) => callback('n')) // Don't stage specific
        .mockImplementationOnce((question, callback) => callback('')); // Empty commit message

      GitUtils.getStagedFiles.mockReturnValue(['file1.js']);

      await CommitCommand.interactiveCommit();

      expect(mockConsoleLog).toHaveBeenCalledWith('❌ Commit message cannot be empty.');
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should exit when no files are staged and not amending', async () => {
      GitUtils.getStagedFiles.mockReturnValue([]);
      GitUtils.getUnstagedFiles.mockReturnValue([]);

      await CommitCommand.interactiveCommit();

      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  No files staged for commit.');
      expect(mockRl.close).toHaveBeenCalled();
    });
  });

  describe('showStatus', () => {
    beforeEach(() => {
      GitUtils.getCurrentBranch.mockReturnValue('main');
    });

    it('should show status with staged and unstaged files', () => {
      GitUtils.getStagedFiles.mockReturnValue(['staged.js']);
      GitUtils.getUnstagedFiles.mockReturnValue(['unstaged.js']);

      CommitCommand.showStatus();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Current Status:');
      expect(mockConsoleLog).toHaveBeenCalledWith('📍 Branch: main');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n✅ Staged files:');
      expect(mockConsoleLog).toHaveBeenCalledWith('   staged.js');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n📝 Unstaged changes:');
      expect(mockConsoleLog).toHaveBeenCalledWith('   unstaged.js');
    });

    it('should show clean directory message', () => {
      GitUtils.getStagedFiles.mockReturnValue([]);
      GitUtils.getUnstagedFiles.mockReturnValue([]);

      CommitCommand.showStatus();

      expect(mockConsoleLog).toHaveBeenCalledWith('✨ Working directory is clean.');
    });
  });

  describe('askQuestion', () => {
    it('should return user response', async () => {
      const mockRl = {
        question: jest.fn((question, callback) => callback('user response'))
      };

      const result = await CommitCommand.askQuestion(mockRl, 'Test question?');

      expect(result).toBe('user response');
      expect(mockRl.question).toHaveBeenCalledWith('Test question?', expect.any(Function));
    });
  });

  describe('showHelp', () => {
    it('should display help information', () => {
      CommitCommand.showHelp();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('git-lazy commit'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Options:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Examples:'));
    });
  });
});