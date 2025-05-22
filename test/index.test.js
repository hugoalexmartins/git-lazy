/**
 * Tests for git-lazy main module
 */

const main = require('../src/index');
const CommitCommand = require('../src/commands/commit');

// Mock the CommitCommand module
jest.mock('../src/commands/commit');

describe('git-lazy main', () => {
  let consoleSpy;
  let consoleErrorSpy;
  let mockProcessExit;
  let originalArgv;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
    
    // Store original argv
    originalArgv = process.argv;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockProcessExit.mockRestore();
    
    // Restore original argv
    process.argv = originalArgv;
  });

  test('main function is properly exported', () => {
    expect(typeof main).toBe('function');
  });

  test('should show general help when no arguments provided', async () => {
    process.argv = ['node', 'git-lazy'];
    
    await main();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('git-lazy - A utility tool'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
  });

  test('should show general help when --help flag is used', async () => {
    process.argv = ['node', 'git-lazy', '--help'];
    
    await main();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('git-lazy - A utility tool'));
  });

  test('should execute commit command with message', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '-m', 'Test commit'];
    
    await main();

    expect(CommitCommand.execute).toHaveBeenCalledWith({
      command: 'commit',
      message: 'Test commit',
      addAll: false,
      amend: false,
      noVerify: false,
      interactive: false,
      files: [],
      help: false
    });
  });

  test('should show commit help when commit --help is used', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '--help'];
    
    await main();

    expect(CommitCommand.showHelp).toHaveBeenCalled();
    expect(CommitCommand.execute).not.toHaveBeenCalled();
  });

  test('should handle commit with add-all flag', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '-a', '-m', 'Test'];
    
    await main();

    expect(CommitCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
      addAll: true,
      message: 'Test'
    }));
  });

  test('should handle commit with files flag', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '-f', 'file1.js,file2.js', '-m', 'Test'];
    
    await main();

    expect(CommitCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
      files: ['file1.js', 'file2.js'],
      message: 'Test'
    }));
  });

  test('should handle commit with amend flag', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '--amend', '-m', 'Amended'];
    
    await main();

    expect(CommitCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
      amend: true,
      message: 'Amended'
    }));
  });

  test('should handle commit with no-verify flag', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '--no-verify', '-m', 'Test'];
    
    await main();

    expect(CommitCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
      noVerify: true,
      message: 'Test'
    }));
  });

  test('should handle interactive commit', async () => {
    process.argv = ['node', 'git-lazy', 'commit', '-i'];
    
    await main();

    expect(CommitCommand.execute).toHaveBeenCalledWith(expect.objectContaining({
      interactive: true
    }));
  });

  test('should show error for unknown command', async () => {
    process.argv = ['node', 'git-lazy', 'unknown'];
    
    await expect(main()).rejects.toThrow('Unknown command: unknown');
  });

  test('should handle errors in main function', async () => {
    CommitCommand.execute.mockRejectedValue(new Error('Test error'));
    process.argv = ['node', 'git-lazy', 'commit', '-m', 'Test'];
    
    await expect(main()).rejects.toThrow('Test error');
  });
});
