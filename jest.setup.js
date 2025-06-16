import '@testing-library/jest-dom';

// Mock window.location
delete window.location;
window.location = { href: 'http://localhost:3000' };

// Mock fetch for tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  fetch.mockClear();
});