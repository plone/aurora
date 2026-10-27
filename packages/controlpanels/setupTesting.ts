import '@testing-library/jest-dom/vitest';

// React Aria's Sheet observes its snap points, which jsdom doesn't support.
globalThis.IntersectionObserver ??= class {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
