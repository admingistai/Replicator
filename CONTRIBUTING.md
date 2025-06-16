# Contributing to Website Replicator

First off, thank you for considering contributing to Website Replicator! It's people like you that make this tool better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Enter URL '....'
3. Click on '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. macOS, Windows, Linux]
 - Browser [e.g. Chrome, Safari]
 - Node.js version
 - URL being replicated (if not sensitive)

**Additional context**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`.
2. **Follow the setup instructions** in the README.
3. **Make your changes** following our coding standards.
4. **Add tests** if you've added code that should be tested.
5. **Ensure the test suite passes** by running `npm test`.
6. **Update documentation** if you've changed APIs.
7. **Submit the pull request!**

## Development Process

### Setting Up Your Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/website-replicator.git
   cd website-replicator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   # Add your OpenAI API key to .env.local for AI features
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

### Coding Standards

#### JavaScript Style Guide

- Use ES6+ features when appropriate
- Use async/await over callbacks
- Prefer const over let, avoid var
- Use meaningful variable names
- Add JSDoc comments for functions

Example:
```javascript
/**
 * Validates and processes a URL
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result
 */
export async function validateUrl(url) {
  const result = { isValid: false, error: null };
  
  try {
    // Validation logic here
    const parsedUrl = new URL(url);
    result.isValid = true;
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}
```

#### React/Next.js Best Practices

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types or TypeScript
- Handle loading and error states
- Make components accessible (ARIA labels, semantic HTML)

#### CSS Guidelines

- Use CSS modules or styled-jsx
- Mobile-first responsive design
- Follow BEM naming convention for classes
- Use CSS variables for theming

### Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

Example:
```javascript
describe('URLValidator', () => {
  test('validates correct HTTPS URLs', () => {
    const result = validateUrl('https://example.com');
    expect(result.isValid).toBe(true);
  });

  test('rejects URLs without protocol', () => {
    const result = validateUrl('example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('protocol');
  });
});
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add support for custom headers in proxy requests
fix: resolve timeout issue with large websites
docs: update API documentation with rate limiting info
```

### Documentation

- Update README.md for user-facing changes
- Update API.md for API changes
- Update SECURITY.md for security-related changes
- Document AI-related features and usage
- Update environment variable documentation
- Add JSDoc comments for new functions
- Include examples where helpful

## Project Structure

```
├── pages/              # Next.js pages
├── components/         # React components
├── api/               # API routes
│   └── utils/         # API utilities
├── utils/             # Shared utilities
├── public/            # Static files
├── styles/            # Global styles
├── __tests__/         # Test files
└── docs/              # Documentation
```

## Review Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] No new warnings generated
- [ ] Tests added and passing
- [ ] Documentation updated

### Pull Request Review

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

### What to Expect

- **Initial response:** Within 48 hours
- **Review feedback:** Within 1 week
- **Merge decision:** After all feedback addressed

## Release Process

1. **Version bump** following semver
2. **Update CHANGELOG.md**
3. **Create release PR**
4. **Tag release** after merge
5. **Deploy to production**

## Community

### Getting Help

- Check existing issues and documentation
- Ask questions in discussions
- Join our community chat (if available)

### Staying Updated

- Watch the repository for updates
- Subscribe to release notifications
- Follow project announcements

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project documentation

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Contact maintainers

Thank you for contributing! 🎉