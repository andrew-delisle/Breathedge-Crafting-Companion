// src/tests/main.test.js
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { appState, resetAppState } from '../state/appState';
import { runMain } from '../scripts/main';

// ✅ FIX: mock correct files that main.js imports
vi.mock('../scripts/utils.js', () => ({
  loadDefaultAssets: vi.fn(),
}));

vi.mock('../scripts/init.js', () => ({
  init: vi.fn(),
}));

vi.mock('../scripts/lib/ui.js', () => ({
  wireGameSelectListener: vi.fn(), // ✅ now it’s a proper spy
}));

import { loadDefaultAssets } from '../scripts/utils.js';
import { init } from '../scripts/init.js';
import { wireGameSelectListener } from '../scripts/lib/ui.js';

describe('main.js startup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAppState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('runs full initialization sequence successfully', async () => {
    loadDefaultAssets.mockResolvedValue();
    init.mockResolvedValue();

    await runMain();

    expect(loadDefaultAssets).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledTimes(1);
    expect(wireGameSelectListener).toHaveBeenCalledTimes(1);
  });

  test('handles dropdown change to a valid game', async () => {
    loadDefaultAssets.mockResolvedValue();
    init.mockResolvedValue();

    await runMain();

    const [[, callback]] = wireGameSelectListener.mock.calls;
    await callback('breathedge');

    expect(appState.gameId).toBe('breathedge');
    expect(init).toHaveBeenCalledTimes(2);
  });

  test('ignores dropdown change to "default" or empty', async () => {
    loadDefaultAssets.mockResolvedValue();
    init.mockResolvedValue();

    await runMain();

    const [[, callback]] = wireGameSelectListener.mock.calls;
    await callback('default');

    expect(appState.gameId).toBeNull();
    expect(init).toHaveBeenCalledTimes(1);
  });

  test('logs and continues on initialization failure', async () => {
    loadDefaultAssets.mockResolvedValue();
    init
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Init failed'));

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runMain();

    const [[, callback]] = wireGameSelectListener.mock.calls;
    await expect(callback('breathedge')).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      '[MAIN] App initialization failed:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});