/** Vitest setup: every test starts with empty localStorage and real timers (tests opt in to fake timers themselves). */
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
