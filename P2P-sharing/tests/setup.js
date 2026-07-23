import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

beforeAll(() => {
  expect.extend(matchers);
});

afterEach(() => {
  cleanup();
});
