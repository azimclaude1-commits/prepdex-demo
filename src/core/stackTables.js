// On narrow screens, tables with class "stack" render each row as a card.
// Each cell needs its column header as data-label; this keeps the labels in sync as React updates rows.
function labelTables() {
  document.querySelectorAll('table.stack').forEach((t) => {
    const heads = [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    t.querySelectorAll('tbody tr').forEach((tr) => {
      let i = 0;
      for (const td of tr.children) {
        const span = td.colSpan || 1;
        const label = span > 1 ? '' : heads[i] || '';
        if (td.getAttribute('data-label') !== label) td.setAttribute('data-label', label);
        i += span;
      }
    });
  });
}

let queued = false;
export function startTableLabels() {
  const run = () => { queued = false; labelTables(); };
  new MutationObserver(() => {
    if (!queued) { queued = true; queueMicrotask(run); }
  }).observe(document.body, { childList: true, subtree: true });
  labelTables();
}
