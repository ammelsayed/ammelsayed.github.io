/**
 * Shared utility for rendering list of cards with search and highlighting functionality.
 * Supports a unified content schema for easy scaling across different sections.
 */
async function ensureYamlParser() {
    if (window.jsyaml) return;

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Unable to load YAML parser'));
        document.head.appendChild(script);
    });
}

async function loadStructuredData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const text = await response.text();
    const cleanUrl = url.split('?')[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
        return JSON.parse(text);
    }

    if (ext === 'yaml' || ext === 'yml') {
        await ensureYamlParser();
        return window.jsyaml.load(text);
    }

    throw new Error(`Unsupported data format: ${ext || 'unknown'}`);
}

async function parseFrontMatter(text) {
    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
    if (!match) return { data: {}, content: text };
    await ensureYamlParser();
    return { data: window.jsyaml.load(match[1]) || {}, content: match[2] };
}

async function loadBlogPosts() {
    return loadStructuredData('/data/blogs.generated.json');
}

window.loadStructuredData = loadStructuredData;
window.loadBlogPosts = loadBlogPosts;
window.parseFrontMatter = parseFrontMatter;

// Text whose matches are wrapped in <span class="highlight">. It is built as
// nodes rather than as a string, so neither the search term nor the content is
// ever parsed as markup.
function appendHighlighted(target, text, term) {
    const value = text == null ? '' : String(text);
    const needle = term ? String(term) : '';

    if (!needle) {
        target.appendChild(document.createTextNode(value));
        return;
    }

    const lowerValue = value.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let from = 0;
    let at = lowerValue.indexOf(lowerNeedle);

    while (at !== -1) {
        if (at > from) target.appendChild(document.createTextNode(value.slice(from, at)));
        const mark = document.createElement('span');
        mark.className = 'highlight';
        mark.textContent = value.slice(at, at + needle.length);
        target.appendChild(mark);
        from = at + needle.length;
        at = lowerValue.indexOf(lowerNeedle, from);
    }

    if (from < value.length) target.appendChild(document.createTextNode(value.slice(from)));
}

// Descriptions in data/*.yaml are authored HTML (press links, bold labels).
// They are parsed and copied through a small allow-list instead of being handed
// to innerHTML, and text is highlighted after parsing so a search term can never
// land inside a tag or an attribute.
const RICH_TEXT_TAGS = new Set(['A', 'B', 'STRONG', 'EM', 'I', 'BR', 'SPAN', 'CODE', 'U', 'SMALL', 'SUP', 'SUB']);
const SAFE_URL = /^(https?:|mailto:|#|\/)/i;

function copySanitizedChildren(source, target, term) {
    source.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            appendHighlighted(target, child.nodeValue, term);
            return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;

        const tag = child.tagName.toUpperCase();
        if (!RICH_TEXT_TAGS.has(tag)) {
            // Unknown wrapper: keep its text, drop the element itself.
            copySanitizedChildren(child, target, term);
            return;
        }

        const el = document.createElement(tag.toLowerCase());
        if (tag === 'A') {
            const href = child.getAttribute('href') || '';
            if (!SAFE_URL.test(href)) return;
            el.setAttribute('href', href);
            const rel = child.getAttribute('rel');
            el.setAttribute('rel', rel || 'noopener');
            const targetAttr = child.getAttribute('target');
            if (targetAttr) el.setAttribute('target', targetAttr);
        }

        copySanitizedChildren(child, el, term);
        target.appendChild(el);
    });
}

function appendRichText(target, html, term) {
    if (html == null || html === '') return;
    const parsed = new DOMParser().parseFromString(String(html), 'text/html');
    copySanitizedChildren(parsed.body, target, term);
}

class CardRenderer {
    constructor(options) {
        this.dataUrl = options.dataUrl;
        this.dataLoader = options.dataLoader || (() => loadStructuredData(this.dataUrl));
        this.listElementId = options.listElementId;
        this.countElementId = options.countElementId;
        this.searchInputSelector = options.searchInputSelector;
        this.itemTypeLabel = options.itemTypeLabel || 'item';
        this.searchFields = options.searchFields || ['title', 'description', 'badge'];
        
        // Custom rendering function (optional, fallback to default)
        this.renderCardFn = options.renderCardFn || this.defaultRenderCard.bind(this);
        
        this.allData = [];
        this.init();
    }

    async init() {
        try {
            this.allData = await this.dataLoader();
            
            // Sort by date if available (latest first)
            this.allData.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(b.date) - new Date(a.date);
            });

            this.displayItems(this.allData);
            this.setupSearch();
        } catch (error) {
            console.error(`Error loading data from ${this.dataUrl}:`, error);
            const listEl = document.getElementById(this.listElementId);
            if (listEl) {
                const errorP = document.createElement('p');
                errorP.style.color = 'red';
                errorP.textContent = `Failed to load content: ${error.message}`;
                listEl.replaceChildren(errorP);
            }
        }
    }

    updateCounts(current, total) {
        const countEl = document.getElementById(this.countElementId);
        if (countEl) {
            const summary = document.createElement('i');
            summary.appendChild(document.createTextNode('Showing '));
            const currentB = document.createElement('b');
            currentB.textContent = current;
            summary.appendChild(currentB);
            summary.appendChild(document.createTextNode(' out of '));
            const totalB = document.createElement('b');
            totalB.textContent = total;
            summary.appendChild(totalB);
            summary.appendChild(document.createTextNode(` ${this.itemTypeLabel}(s).`));
            countEl.replaceChildren(summary);
        }
    }

    displayItems(data, searchTerm = '') {
        const listEl = document.getElementById(this.listElementId);
        if (!listEl) return;

        listEl.replaceChildren();
        this.updateCounts(data.length, this.allData.length);

        data.forEach(item => {
            const card = this.renderCardFn(item, searchTerm, this.highlightText.bind(this));
            listEl.appendChild(card);
        });
    }

    setupSearch() {
        const searchInput = document.querySelector(this.searchInputSelector);
        if (!searchInput) return;

        let debounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => this.runSearch(searchInput.value), 300);
        });
    }

    runSearch(term) {
        term = term.trim().toLowerCase();
        if (!term) {
            this.displayItems(this.allData);
            return;
        }

        const filtered = this.allData
            .map(item => {
                let matchCount = 0;
                this.searchFields.forEach(field => {
                    const value = String(item[field] || '').toLowerCase();
                    if (value.includes(term)) matchCount++;
                    
                    // Also search in meta fields if they exist
                    if (item.meta && Array.isArray(item.meta)) {
                        item.meta.forEach(m => {
                            if (String(m.text || '').toLowerCase().includes(term)) matchCount++;
                        });
                    }
                });
                return { item, matchCount };
            })
            .filter(x => x.matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount)
            .map(x => x.item);

        this.displayItems(filtered, term);
    }

    highlightText(text, term) {
        if (!term || !text) return text;
        const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        return String(text).replace(regex, '<span class="highlight">$1</span>');
    }

    /**
     * Default rendering logic for the Unified Content Schema.
     */
    defaultRenderCard(item, term) {
        const card = document.createElement('div');
        card.className = 'publication'; // Using existing class for styling consistency
        if (item.link) card.style.cursor = 'pointer';

        const content = document.createElement('div');
        content.className = 'content';
        card.appendChild(content);

        if (item.badge) {
            const badgeP = document.createElement('p');
            badgeP.className = 'badge-container';
            const badgeEm = document.createElement('em');
            const badgeB = document.createElement('b');
            appendHighlighted(badgeB, item.badge, term);
            badgeEm.appendChild(badgeB);
            badgeP.appendChild(badgeEm);
            content.appendChild(badgeP);
        }

        const titleEl = document.createElement('h2');
        appendHighlighted(titleEl, item.title, term);
        content.appendChild(titleEl);

        // Author info (for blogs)
        if (item.author) {
            const authorBox = document.createElement('div');
            authorBox.className = 'author_information';

            if (item.author.image) {
                const avatar = document.createElement('img');
                avatar.src = item.author.image;
                avatar.className = 'author_image';
                avatar.setAttribute('decoding', 'async');
                avatar.alt = item.author.name || '';
                authorBox.appendChild(avatar);
            }

            const nameBox = document.createElement('div');
            nameBox.className = 'AuthorName_and_Date';
            const nameEm = document.createElement('em');
            nameEm.appendChild(document.createTextNode(' By '));
            const nameLink = document.createElement('a');
            nameLink.href = item.author.link || '#';
            nameLink.target = '_blank';
            nameLink.rel = 'noopener';
            appendHighlighted(nameLink, item.author.name, term);
            nameEm.appendChild(nameLink);
            nameBox.appendChild(nameEm);
            authorBox.appendChild(nameBox);
            content.appendChild(authorBox);
        }

        if (item.meta && Array.isArray(item.meta) && item.meta.length > 0) {
            const metaP = document.createElement('p');
            item.meta.forEach((entry, index) => {
                const span = document.createElement('span');
                if (entry.icon) span.appendChild(document.createTextNode(`${entry.icon} `));
                const metaEm = document.createElement('em');
                appendHighlighted(metaEm, entry.text, term);
                span.appendChild(metaEm);
                if (index > 0) metaP.appendChild(document.createTextNode(' '));
                metaP.appendChild(span);
            });
            content.appendChild(metaP);
        }

        const divider = document.createElement('hr');
        divider.style.margin = '10px 0';
        divider.style.border = 'none';
        divider.style.borderTop = '1px solid var(--border-color)';
        content.appendChild(divider);

        const abstractP = document.createElement('p');
        abstractP.className = 'abstract';
        appendRichText(abstractP, item.description, term);
        content.appendChild(abstractP);

        if (item.link && item.link.includes('doi.org')) {
            const doiP = document.createElement('p');
            doiP.id = 'doi-link';
            const doiLabel = document.createElement('b');
            doiLabel.textContent = 'DOI:';
            doiP.appendChild(doiLabel);
            doiP.appendChild(document.createTextNode(' '));
            const doiLink = document.createElement('a');
            doiLink.href = item.link;
            doiLink.target = '_blank';
            doiLink.rel = 'noopener';
            appendHighlighted(doiLink, item.link, term);
            doiP.appendChild(doiLink);
            content.appendChild(doiP);
        }

        // The card image sits below the fold of a list page: defer it, and let
        // the intrinsic dimensions reserve its space when the data provides them.
        if (item.image) {
            const figure = document.createElement('img');
            figure.src = item.image;
            figure.className = 'publication-image';
            figure.setAttribute('loading', 'lazy');
            figure.setAttribute('decoding', 'async');
            if (item.image_width && item.image_height) {
                figure.width = item.image_width;
                figure.height = item.image_height;
            }
            card.appendChild(figure);
        }

        if (item.link) {
            card.addEventListener('dblclick', () => {
                window.location.href = item.link;
            });
        }

        return card;
    }
}

window.CardRenderer = CardRenderer;

/**
 * Scroll to top functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scroll-to-top';
    scrollBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    `;
    document.body.appendChild(scrollBtn);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
