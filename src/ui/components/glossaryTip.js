/**
 * glossaryTip.js — Inline glossary tooltip component.
 * Wraps a science term with a dotted underline and tooltip on hover/focus.
 */

let glossaryData = null;

export async function loadGlossary() {
  if (glossaryData) return glossaryData;
  try {
    const res = await fetch('/data/glossary.json');
    const json = await res.json();
    glossaryData = {};
    for (const entry of json.terms) {
      glossaryData[entry.id] = entry;
    }
  } catch (e) {
    glossaryData = {};
  }
  return glossaryData;
}

/**
 * Wrap a text node's science terms with clickable glossary spans.
 * Call after loadGlossary() resolves.
 * @param {HTMLElement} container - Parent element to scan for text.
 */
export function applyGlossaryTips(container) {
  if (!glossaryData) return;

  const termMap = {
    'sol': 'sol',
    'solar flare': 'solar-flare',
    'particle storm': 'particle-storm',
    'radiation dose': 'radiation-dose',
    'shielding': 'shielding',
    'power block': 'power-block',
    'communication delay': 'comm-delay',
    'mission control': 'mission-control',
  };

  // Walk text nodes and replace matches
  walkTextNodes(container, termMap);
}

function walkTextNodes(node, termMap) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    const lower = text.toLowerCase();
    for (const [term, id] of Object.entries(termMap)) {
      if (lower.includes(term) && glossaryData[id]) {
        const idx = lower.indexOf(term);
        const before = text.slice(0, idx);
        const matched = text.slice(idx, idx + term.length);
        const after = text.slice(idx + term.length);

        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));

        const span = document.createElement('span');
        span.className = 'glossary-term';
        span.textContent = matched;
        span.setAttribute('tabindex', '0');
        span.setAttribute('role', 'definition');
        span.title = glossaryData[id].definition;

        const tip = document.createElement('span');
        tip.className = 'glossary-tooltip hidden';
        tip.textContent = glossaryData[id].definition;
        span.appendChild(tip);

        span.addEventListener('mouseenter', () => tip.classList.remove('hidden'));
        span.addEventListener('mouseleave', () => tip.classList.add('hidden'));
        span.addEventListener('focus', () => tip.classList.remove('hidden'));
        span.addEventListener('blur', () => tip.classList.add('hidden'));

        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));

        node.parentNode.replaceChild(frag, node);
        return; // only replace first match per text node to avoid DOM chaos
      }
    }
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    !['SCRIPT', 'STYLE', 'INPUT', 'BUTTON', 'A'].includes(node.tagName)
  ) {
    for (const child of Array.from(node.childNodes)) {
      walkTextNodes(child, termMap);
    }
  }
}

