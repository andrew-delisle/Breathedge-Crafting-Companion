import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('version-display.js', () => {
  let versionElement;

  beforeEach(() => {
    document.body.innerHTML = `<div id="versionDisplay"></div>`;
    versionElement = document.getElementById('versionDisplay');
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('loads version and updates DOM on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.2.3' }),
    });

    await import('../scripts/version-display.js');

    expect(versionElement.innerHTML).toContain('v1.2.3');
    expect(versionElement.innerHTML).toContain('Changelog');
  });

  test('falls back to changelog link if fetch fails', async () => {
    fetch.mockRejectedValue(new Error('Network error'));

    await import('../scripts/version-display.js');

    expect(versionElement.innerHTML).toContain('Changelog');
    expect(versionElement.innerHTML).not.toContain('version-text');
  });

  test('falls back to changelog link if response is not ok', async () => {
    fetch.mockResolvedValue({ ok: false });

    await import('../scripts/version-display.js');

    expect(versionElement.innerHTML).toContain('Changelog');
    expect(versionElement.innerHTML).not.toContain('version-text');
  });
});
