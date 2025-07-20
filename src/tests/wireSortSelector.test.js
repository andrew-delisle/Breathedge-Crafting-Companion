import { describe, test, expect, beforeEach, vi } from 'vitest';
import { wireSortSelect } from '../scripts/lib/ui.js';
import { renderList } from '../scripts/lib/renderList.util.js';

vi.mock('../scripts/lib/renderList.util.js', () => ({
  renderList: vi.fn(),
}));

describe('ui.js > wireSortSelect', () => {
  let dropdown;

  beforeEach(() => {
    document.body.innerHTML = ''; // clean DOM
    vi.clearAllMocks();
  });

  test('logs error if dropdown not found', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    wireSortSelect('#missingDropdown');
    expect(errorSpy).toHaveBeenCalledWith(
      '[UI] Sort dropdown not found for selector: #missingDropdown'
    );
    errorSpy.mockRestore();
  });

  test('calls renderList when sort order changes to asc', () => {
    dropdown = document.createElement('select');
    dropdown.id = 'sortSelect';
    dropdown.innerHTML = `<option value="asc">A-Z</option><option value="desc">Z-A</option>`;
    document.body.appendChild(dropdown);

    wireSortSelect('#sortSelect');

    dropdown.value = 'asc';
    dropdown.dispatchEvent(new Event('change'));

    expect(renderList).toHaveBeenCalledTimes(1);
  });

  test('calls renderList when sort order changes to desc', () => {
    dropdown = document.createElement('select');
    dropdown.id = 'sortSelect';
    dropdown.innerHTML = `<option value="asc">A-Z</option><option value="desc">Z-A</option>`;
    document.body.appendChild(dropdown);

    wireSortSelect('#sortSelect');

    dropdown.value = 'desc';
    dropdown.dispatchEvent(new Event('change'));

    expect(renderList).toHaveBeenCalledTimes(1);
  });
});




