# git-lazy

A utility tool for simplifying common git operations.

## Description

git-lazy is a Node.js CLI tool designed to make common git operations faster and more convenient. It provides shortcuts and simplified commands for frequently used git workflows.

## Installation

```
npm install -g git-lazy
# or
pnpm add -g git-lazy
```

## Usage

```
git-lazy [command] [options]
```

## Development

### Requirements

- Node.js >= 14.0.0
- PNPM >= 10.8.0

### Setup

```
# Clone the repository
git clone https://github.com/yourusername/git-lazy.git
cd git-lazy

# Install dependencies
pnpm install
```

### Scripts

- `pnpm start`: Run the tool locally
- `pnpm test`: Run tests
- `pnpm test:watch`: Run tests in watch mode
- `pnpm test:coverage`: Run tests with coverage report
- `pnpm lint`: Run ESLint to check code quality
- `pnpm format`: Format code with Prettier
- `pnpm build`: Build the project

## Code Quality

This project uses ESLint and Prettier to ensure code quality and consistent formatting:

- ESLint enforces code quality rules
- Prettier ensures consistent code formatting

Run the linting and formatting with:

```bash
# Check for code quality issues
pnpm lint

# Format all files
pnpm format
```

## License

ISC
