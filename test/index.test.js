/**
 * Tests for git-lazy
 */

const main = require('../src/index');

describe('git-lazy', () => {
  let consoleSpy;

  beforeEach(() => {
    // Mock console.log to test output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore console.log after each test
    consoleSpy.mockRestore();
  });

  test('main function outputs the expected greeting message', () => {
    // Call the main function
    main();

    // Verify the expected output
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Hello from git-lazy!');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, 'This is a Node.js utility for git operations.');
  });

  test('main function is properly exported', () => {
    // Check that the export is a function
    expect(typeof main).toBe('function');
  });
});
