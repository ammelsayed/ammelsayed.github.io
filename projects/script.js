/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

// global store
let publicationsData = [];

// fetch JSON & kick off
function fetchJSONData() {
  fetch('projects.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      publicationsData = data;
      displayPublications(publicationsData);
    })
    .catch(err => console.error('Error loading posts:', err));
}

// update count line
function updatePublicationCounts(current, total) {
  document.getElementById('event-count').innerHTML =
    `<i>Showing <b>${current}</b> out of <b>${total}</b> project(s).</i>`;
}

// render ALL posts (no highlight)
function displayPublications(data) {
  updatePublicationCounts(data.length, publicationsData.length);

  const list = document.getElementById('events-list');
  list.innerHTML = '';

  data.forEach(pub => {
    const card = document.createElement('div');
    card.className = 'publication';
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="content">
        <p style="color: navy;"><em><b>${pub.type}</b></em></p>
        <h2>${pub.title}</h2>
        <p class="abstract">${pub.description}</p>
      </div>
      <img src="${pub.image_soruce}" class="publication-image">
    `;

    // double-click to navigate
    card.addEventListener('dblclick', () => {
      window.location.href = pub.link;
    });

    list.appendChild(card);
  });
}

// ——— SEARCH SETUP ———
const searchInput = document.querySelector('.search-input');
let debounceTimeout;

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(runSearch, 300);
});

function runSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return displayPublications(publicationsData);

  // filter & score by occurrences in title/author/date/description-text
  const filtered = publicationsData
    .map(pub => {
      // strip tags from description just for matching
      const descText = pub.description.replace(/<[^>]+>/g, ' ');
      const hay = [
        pub.title,
        pub.author,
        pub.date,
        descText
      ].join(' ').toLowerCase();

      const count = (hay.match(new RegExp(term, 'g')) || []).length;
      return { pub, count };
    })
    .filter(x => x.count > 0)
    .sort((a,b) => b.count - a.count)
    .map(x => x.pub);

  displayPublicationsWithHighlights(filtered, term);
}

// render filtered + highlighted
function displayPublicationsWithHighlights(data, term) {
  updatePublicationCounts(data.length, publicationsData.length);

  const list = document.getElementById('events-list');
  list.innerHTML = '';

  data.forEach(pub => {
    const card = document.createElement('div');
    card.className = 'publication';
    card.style.cursor = 'pointer';

    // highlightTextInHTML(fromHTML, term) preserves tags
    const hType  = highlightTextInHTML(pub.type, term);
    const hTitle = highlightTextInHTML(pub.title, term);
    const hDesc  = highlightTextInHTML(pub.description, term);

    card.innerHTML = `
      <div class="content">
        <p style="color: navy;"><em><b>${hType}</b></em></p>
        <h2>${hTitle}</h2>
        <p class="abstract">${hDesc}</p>
      </div>
      <img src="${pub.image_soruce}" class="publication-image">
    `;

    // double-click to navigate
    card.addEventListener('dblclick', () => {
      window.location.href = pub.link;
    });

    list.appendChild(card);
  });
}

// ——— core highlight util ———
// wraps matches in <span class="highlight"> but leaves all tags intact
function highlightTextInHTML(htmlString, term) {
  // wrap in container so we can parse
  const container = document.createElement('div');
  container.innerHTML = htmlString;

  const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')})`, 'gi');

  function walk(node) {
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
          // text before match
          const before = text.slice(lastIndex, match.index);
          if (before) frag.appendChild(document.createTextNode(before));

          // matched span
          const mark = document.createElement('span');
          mark.className = 'highlight';
          mark.textContent = match[0];
          frag.appendChild(mark);

          lastIndex = regex.lastIndex;
        }
        // trailing text
        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  }

  walk(container);
  return container.innerHTML;
}

// bootstrap
document.addEventListener('DOMContentLoaded', fetchJSONData);
