// Site-wide search for the header.
//
// The header renders on every page, so the search cannot be a filter over the
// list that happens to be open. It reads data/search-index.json — built by
// scripts/build-search-index.rb alongside the other generated data — and scores
// it in the page: one fetch on first use, no extra dependency, no reload when a
// result is opened.

const INDEX_URL = '/data/search-index.json';
const MAX_RESULTS = 14;
const DEBOUNCE_MS = 120;
const SNIPPET_WIDTH = 150;

// Weight per field. The title decides most matches; the body only has to say
// whether the words occur at all, so it sits at the bottom.
const FIELDS = [
  ['title', 6],
  ['tags', 3],
  ['description', 2.2],
  ['body', 1]
];

const strip = value => (value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const words = value => strip(value).split(/[^a-z0-9\u00c0-\uffff]+/).filter(Boolean);

// Two words one edit apart: enough to absorb a typo, not enough to match
// unrelated words.
function near(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (a.length < b.length) j += 1;
    else { i += 1; j += 1; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// Quality of one token against one field: whole word, then prefix, then a
// substring, then a near-miss.
function quality(text, list, token) {
  if (list.includes(token)) return 3;
  if (list.some(word => word.startsWith(token))) return 2.2;
  if (text.includes(token)) return 1.3;
  if (token.length >= 4 && list.some(word => near(word, token))) return 0.85;
  return 0;
}

function prepare(item) {
  const text = {};
  const parts = {};
  for (const [name] of FIELDS) {
    text[name] = strip(item[name]);
    parts[name] = words(item[name]);
  }
  return { ...item, text, parts };
}

// Every token has to land somewhere, so extra words narrow the result instead
// of widening it. A full title match beats scattered body hits.
function score(item, tokens) {
  let total = 0;
  let inTitle = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [name, weight] of FIELDS) {
      const hit = quality(item.text[name], item.parts[name], token);
      if (hit) best = Math.max(best, hit * weight);
      if (hit && name === 'title') inTitle += 1;
    }
    if (!best) return 0;
    total += best;
  }
  return inTitle === tokens.length ? total * 1.3 : total;
}

function snippet(item, tokens) {
  const description = item.description || '';
  const body = item.body || '';
  const source = tokens.some(token => strip(description).includes(token)) || !body ? description : body;
  if (!source) return '';

  const haystack = strip(source);
  let at = -1;
  for (const token of tokens) {
    const found = haystack.indexOf(token);
    if (found >= 0 && (at < 0 || found < at)) at = found;
  }

  let start = at > 0 ? Math.max(0, at - 45) : 0;
  let text = source.slice(start, start + SNIPPET_WIDTH);
  if (start > 0) text = `…${text}`;
  if (start + SNIPPET_WIDTH < source.length) text = `${text}…`;
  return text.trim();
}

// Writes the text into the given element, wrapping the matched words in
// <mark>. Matching happens on the string, so nothing from the index ever
// reaches the page as markup.
function markMatches(parent, text, tokens) {
  const marks = tokens.filter(token => token.length > 1);
  if (!marks.length || !text) {
    parent.append(text || '');
    return parent;
  }
  const pattern = new RegExp(
    `(${marks.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parent.append(text.slice(last, match.index));
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    parent.append(mark);
    last = match.index + match[0].length;
  }
  if (last < text.length) parent.append(text.slice(last));
  return parent;
}

// The index is written from the YAML sources, but a link that is not a path or
// a web address should not become a clickable script on the page.
const SAFE_URL = /^(\/(?!\/)|https?:\/\/|mailto:)/i;
const safeUrl = value => {
  const url = String(value || '').trim();
  return SAFE_URL.test(url) ? url : '#';
};

const HINTS = [
  [['↑', '↓'], ' to move'],
  [['↵'], ' to open'],
  [['esc'], ' to close']
];

function hint(keys, label) {
  const wrap = document.createElement('span');
  for (const key of keys) {
    const keycap = document.createElement('kbd');
    keycap.textContent = key;
    wrap.append(keycap);
  }
  wrap.append(label);
  return wrap;
}

function message(text) {
  const box = document.createElement('div');
  box.className = 'site-search-empty';
  box.textContent = text;
  return box;
}

export function createSiteSearch(field, { onDismiss } = {}) {
  let loaded = null;
  let term = '';
  let shown = '';
  let timer = 0;
  let sequence = 0;
  let active = -1;

  const backdrop = document.createElement('div');
  backdrop.className = 'site-search-backdrop';
  backdrop.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'site-search';
  panel.hidden = true;

  const inner = document.createElement('div');
  inner.className = 'site-search-inner';

  const list = document.createElement('div');
  list.className = 'site-search-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Search results');

  const foot = document.createElement('div');
  foot.className = 'site-search-foot';
  for (const [keys, label] of HINTS) foot.append(hint(keys, label));

  inner.append(list, foot);
  panel.append(inner);
  document.body.append(backdrop, panel);

  const load = () => {
    if (!loaded) {
      loaded = fetch(INDEX_URL, { cache: 'no-cache' })
        .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
        .then(data => (Array.isArray(data.items) ? data.items : []).map(prepare))
        // A failed request must not stick: the next open retries it.
        .catch(error => {
          loaded = null;
          throw error;
        });
    }
    return loaded;
  };

  // The search field covers the bar and the panel hangs directly under it, so
  // both follow the header height rather than a hard-coded 80px.
  function place() {
    const header = document.querySelector('header');
    const height = header ? header.getBoundingClientRect().height : 80;
    panel.style.top = `${height}px`;
    panel.style.maxHeight = `calc(100vh - ${height + 24}px)`;
  }

  // The panel only appears once there is something to put in it; an empty
  // field leaves the bar undisturbed.
  function reveal(visible) {
    panel.hidden = !visible;
    backdrop.hidden = !visible;
  }

  function row(item, tokens) {
    const link = document.createElement('a');
    link.className = 'site-search-item';
    link.href = safeUrl(item.url);
    link.setAttribute('role', 'option');
    link.setAttribute('aria-selected', 'false');

    const line = document.createElement('span');
    line.className = 'site-search-line';

    const kind = document.createElement('span');
    kind.className = 'site-search-kind';
    kind.textContent = item.kind;

    const title = document.createElement('span');
    title.className = 'site-search-title';
    markMatches(title, item.title, tokens);

    const note = document.createElement('span');
    note.className = 'site-search-snippet';
    markMatches(note, snippet(item, tokens), tokens);

    line.append(kind, title);
    link.append(line, note);
    return link;
  }

  async function render() {
    const ticket = ++sequence;
    const tokens = words(term);

    // Nothing typed, nothing to show: the field keeps the bar to itself.
    if (!tokens.length) {
      active = -1;
      shown = '';
      list.replaceChildren();
      reveal(false);
      return;
    }

    let items;
    try {
      items = await load();
    } catch (error) {
      if (ticket !== sequence) return;
      reveal(true);
      list.replaceChildren(message('The search index could not be loaded.'));
      shown = term.trim();
      return;
    }
    if (ticket !== sequence) return;

    reveal(true);

    const hits = items
      .map(item => ({ item, score: score(item, tokens) }))
      .filter(hit => hit.score > 0)
      .sort((a, b) => b.score - a.score || String(b.item.date).localeCompare(String(a.item.date)))
      .slice(0, MAX_RESULTS)
      .map(hit => hit.item);

    active = -1;
    list.replaceChildren();

    if (!hits.length) {
      list.append(message(`No results for “${term.trim()}”.`));
      shown = term.trim();
      return;
    }

    for (const item of hits) list.append(row(item, tokens));
    shown = term.trim();
  }

  // While a new query is still waiting for the debounce, the rows on screen
  // belong to the previous one, so keys are ignored until they match again.
  const current = () => shown === term.trim();

  function move(step) {
    if (!current()) return;
    const rows = list.querySelectorAll('.site-search-item');
    if (!rows.length) return;
    active = Math.max(0, Math.min(rows.length - 1, active + step));
    rows.forEach((element, index) => {
      const selected = index === active;
      element.setAttribute('aria-selected', String(selected));
      element.classList.toggle('active', selected);
    });
    rows[active].scrollIntoView({ block: 'nearest' });
  }

  function activate() {
    if (!current()) return false;
    const rows = list.querySelectorAll('.site-search-item');
    if (!rows.length) return false;
    const target = rows[active] || rows[0];
    window.location.assign(target.getAttribute('href'));
    return true;
  }

  field.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter') {
      // Always swallow Enter: the field sits in a form, and with no result to
      // open a default submission would reload the page and lose the query.
      event.preventDefault();
      activate();
    }
  });

  backdrop.addEventListener('click', () => {
    if (onDismiss) onDismiss();
  });

  return {
    show() {
      place();
      reveal(false);
      render();
    },
    hide() {
      reveal(false);
      active = -1;
    },
    layout() {
      place();
    },
    update(value) {
      term = value;
      clearTimeout(timer);
      if (!term.trim()) {
        render();
        return;
      }
      timer = setTimeout(render, DEBOUNCE_MS);
    },
    move,
    activate
  };
}
