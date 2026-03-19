import { pinState, unpinRecipe, unpinAll, toggleNode, computeMaterialsSummary } from '../../state/pinState.js';
import { getColorForLevel } from '../utils.js';
import { appState } from '../../state/appState.js';

/**
 * Full re-render of the pinned section and materials summary.
 * Called any time pin state changes.
 */
export function renderPinned() {
  // Snapshot which pinned cards are currently expanded so we can restore
  // the open/closed state after the DOM rebuild.
  const expandedKeys = new Set();
  document.querySelectorAll('.pinned-card').forEach(card => {
    const tree = card.querySelector('.pinned-tree');
    if (tree && tree.style.display !== 'none') {
      expandedKeys.add(card.dataset.recipeKey);
    }
  });

  renderMaterialsSummary();
  renderPinnedRecipes(expandedKeys);
}

// ---------------------------------------------------------------------------
// Materials Summary
// ---------------------------------------------------------------------------

function renderMaterialsSummary() {
  const container = document.getElementById('materialsSummary');
  if (!container) return;

  const summary = computeMaterialsSummary(appState.data);

  if (pinState.pinnedRecipes.size === 0 || summary.size === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');

  const items = [...summary.entries()]
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));

  container.innerHTML = `
    <div class="summary-header">
      <span class="summary-title">📦 Materials Needed</span>
      <button id="clearAllPins" class="btn-clear-all">Clear All</button>
    </div>
    <div class="summary-items">
      ${items.map(([key, { name, qty }]) => `
        <div class="summary-item">
          <span class="summary-name">${name}</span>
          <span class="summary-qty">x${qty}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('clearAllPins')?.addEventListener('click', () => {
    unpinAll();
    renderPinned();
    document.dispatchEvent(new CustomEvent('pins:changed'));
  });
}

// ---------------------------------------------------------------------------
// Pinned Recipe Cards
// ---------------------------------------------------------------------------

function renderPinnedRecipes(expandedKeys = new Set()) {
  const container = document.getElementById('pinnedRecipes');
  if (!container) return;

  container.innerHTML = '';

  if (pinState.pinnedRecipes.size === 0) return;

  for (const [recipeKey, recipe] of pinState.pinnedRecipes) {
    const card = buildPinnedCard(recipeKey, recipe, expandedKeys.has(recipeKey));
    container.appendChild(card);
  }
}

function buildPinnedCard(recipeKey, recipe, startExpanded = false) {
  const card = document.createElement('div');
  card.classList.add('pinned-card');
  card.dataset.recipeKey = recipeKey;

  // Header row
  const header = document.createElement('div');
  header.classList.add('pinned-card-header');

  const title = document.createElement('span');
  title.classList.add('pinned-card-title');
  title.textContent = recipe.name;

  const toggleBtn = document.createElement('button');
  toggleBtn.classList.add('btn-toggle-pinned');
  toggleBtn.textContent = '▶ Show';
  toggleBtn.setAttribute('aria-expanded', 'false');

  const removeBtn = document.createElement('button');
  removeBtn.classList.add('btn-remove-pin');
  removeBtn.textContent = '✕ Remove';
  removeBtn.addEventListener('click', () => {
    unpinRecipe(recipeKey);
    renderPinned();
    document.dispatchEvent(new CustomEvent('pins:changed'));
  });

  header.appendChild(title);
  header.appendChild(toggleBtn);
  header.appendChild(removeBtn);
  card.appendChild(header);

  // Ingredient tree — restore expanded state if it was open before re-render
  const treeContainer = document.createElement('div');
  treeContainer.classList.add('pinned-tree');
  treeContainer.style.display = startExpanded ? 'block' : 'none';
  buildTree(treeContainer, recipeKey, recipe);
  card.appendChild(treeContainer);

  if (startExpanded) {
    toggleBtn.textContent = '▼ Hide';
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  toggleBtn.addEventListener('click', () => {
    const expanded = treeContainer.style.display !== 'none';
    treeContainer.style.display = expanded ? 'none' : 'block';
    toggleBtn.textContent = expanded ? '▶ Show' : '▼ Hide';
    toggleBtn.setAttribute('aria-expanded', String(!expanded));
  });

  return card;
}

function buildTree(container, recipeKey, recipe) {
  // Only render top-level nodes (no parentNodeId), then recurse
  const topLevel = [...recipe.nodes.entries()]
    .filter(([, node]) => node.parentNodeId === null);

  for (const [nodeId, node] of topLevel) {
    renderNode(container, recipeKey, nodeId, node, recipe.nodes);
  }
}

function renderNode(container, recipeKey, nodeId, node, allNodes) {
  const color = getColorForLevel(node.level);
  const indent = node.level * 20;

  const row = document.createElement('div');
  row.classList.add('pinned-ingredient');
  row.dataset.nodeId = nodeId;
  row.style.paddingLeft = `${indent}px`;
  row.style.color = color;
  if (node.disabled) row.classList.add('node-disabled');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.classList.add('node-checkbox');
  checkbox.checked = node.checked;
  checkbox.disabled = node.disabled;
  checkbox.addEventListener('change', () => {
    toggleNode(recipeKey, nodeId);
    renderPinned();
  });

  const label = document.createElement('label');
  label.textContent = node.text;

  row.appendChild(checkbox);
  row.appendChild(label);
  container.appendChild(row);

  // Render children immediately after their parent
  const children = [...allNodes.entries()]
    .filter(([, n]) => n.parentNodeId === nodeId);
  for (const [childId, childNode] of children) {
    renderNode(container, recipeKey, childId, childNode, allNodes);
  }
}
