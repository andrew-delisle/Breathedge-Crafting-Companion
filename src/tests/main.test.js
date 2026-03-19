// src/tests/main.test.js
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { runMain } from '../scripts/main';

vi.mock('../scripts/init.js', () => ({
  init: vi.fn(),
}));

vi.mock('../scripts/lib/ui.js', () => ({
  wireSortSelect: vi.fn(),
}));

import { init } from '../scripts/init.js';
import { wireSortSelect } from '../scripts/lib/ui.js';

describe('main.js startup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('calls init() on startup', async () => {
    init.mockResolvedValue();

    await runMain();

    expect(init).toHaveBeenCalledTimes(1);
  });

  test('wires the sort dropdown after init', async () => {
    init.mockResolvedValue();

    await runMain();

    expect(wireSortSelect).toHaveBeenCalledWith('#sortSelect');
  });

  test('logs error if init throws', async () => {
    init.mockRejectedValue(new Error('Init failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runMain();

    expect(errorSpy).toHaveBeenCalledWith(
      '[MAIN] App initialization failed:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
