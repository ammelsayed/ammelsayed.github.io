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

    // Matched with a case-insensitive regex instead of indexOf() on a lowercased
    // copy: a few characters change length when lowercased (U+0130 for one), and
    // offsets taken from the copy no longer line up with the original text.
    const pattern = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(pattern, 'gi');
    let lastIndex = 0;
    let match;

    while ((match = matcher.exec(value)) !== null) {
        if (match.index > lastIndex) {
            target.appendChild(document.createTextNode(value.slice(lastIndex, match.index)));
        }
        const mark = document.createElement('span');
        mark.className = 'highlight';
        mark.textContent = match[0];
        target.appendChild(mark);
        lastIndex = match.index + match[0].length;
        if (match[0].length === 0) matcher.lastIndex += 1;
    }

    if (lastIndex < value.length) target.appendChild(document.createTextNode(value.slice(lastIndex)));
}

// Descriptions in data/*.yaml are authored HTML (press links, bold labels).
// They are parsed and copied through a small allow-list instead of being handed
// to innerHTML, and text is highlighted after parsing so a search term can never
// land inside a tag or an attribute.
const RICH_TEXT_TAGS = new Set(['A', 'B', 'STRONG', 'EM', 'I', 'BR', 'SPAN', 'CODE', 'U', 'SMALL', 'SUP', 'SUB']);
// Only absolute http(s), mailto, in-page anchors and root-relative paths. A
// protocol-relative "//host" is rejected: it would take the visitor to another
// host on the page's own scheme.
const SAFE_URL = /^(?:https?:|mailto:|#|\/(?!\/))/i;

// Any card link (author, DOI, description) goes through this before it is
// assigned, so a javascript: or data: URL in the data can never become a
// clickable link. A backslash is refused too: the browser folds "\" into "/",
// so "/\host" would resolve as protocol-relative and leave this origin.
function safeHref(value, fallback) {
    const url = typeof value === 'string' ? value.trim() : '';
    if (!url || url.includes('\\')) return fallback;
    return SAFE_URL.test(url) ? url : fallback;
}

// A block element outside the allow-list is reduced to its text, with a space at
// its boundaries so <p>First</p><p>Second</p> does not read as "FirstSecond".
const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'TR', 'SECTION', 'ARTICLE']);

function separateWords(target) {
    const last = target.lastChild;
    if (!last) return;
    const text = last.nodeType === Node.TEXT_NODE ? last.nodeValue : last.textContent;
    if (text && !/\s$/.test(text)) target.appendChild(document.createTextNode(' '));
}

// Card images are assigned their url only once they are in the document and near
// the viewport: a detached <img src> starts downloading immediately, and
// loading="lazy" only applies to an element the browser has laid out.
let cardImageObserver = null;

function loadCardImage(image) {
    const src = image.getAttribute('data-src');
    if (!src) return;
    image.removeAttribute('data-src');
    image.src = src;
}

function observeCardImage(image) {
    if (!('IntersectionObserver' in window)) {
        loadCardImage(image);
        return;
    }
    if (!cardImageObserver) {
        cardImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                // A queued entry can outlive the card it describes: a search may
                // have replaced the list between the scroll and this callback.
                if (!entry.target.isConnected) return;
                loadCardImage(entry.target);
            });
        }, { rootMargin: '200px 0px' });
    }
    cardImageObserver.observe(image);
}

// Cards that are about to be thrown away must be unobserved, or the observer
// keeps the detached images (and their urls) alive across every search.
function forgetCardImages(root) {
    if (!cardImageObserver || !root) return;
    root.querySelectorAll('img').forEach(image => cardImageObserver.unobserve(image));
}

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
            const isBlock = BLOCK_TAGS.has(tag);
            if (isBlock) separateWords(target);
            copySanitizedChildren(child, target, term);
            if (isBlock) separateWords(target);
            return;
        }

        if (tag === 'A') {
            const href = safeHref(child.getAttribute('href'), '');
            if (!href) {
                // Unusable link: keep the label, drop the anchor.
                copySanitizedChildren(child, target, term);
                return;
            }
            const link = document.createElement('a');
            link.setAttribute('href', href);
            const targetAttr = child.getAttribute('target');
            if (targetAttr) link.setAttribute('target', targetAttr);
            // An authored rel is only added to, token by token: noopener is always
            // present, so a new tab can never reach back into this page through
            // window.opener. Tested as a whole token, not as a substring: "x-noopenerx"
            // is not noopener.
            const relTokens = (child.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
            if (!relTokens.includes('noopener')) relTokens.push('noopener');
            if (!relTokens.includes('noreferrer')) relTokens.push('noreferrer');
            link.setAttribute('rel', relTokens.join(' '));
            copySanitizedChildren(child, link, term);
            target.appendChild(link);
            return;
        }

        const el = document.createElement(tag.toLowerCase());
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

        forgetCardImages(listEl);
        listEl.replaceChildren();
        this.updateCounts(data.length, this.allData.length);

        data.forEach(item => {
            const card = this.renderCardFn(item, searchTerm, this.highlightText.bind(this));
            listEl.appendChild(card);
        });
    }

    setupSearch() {
        let debounceTimeout;
        const schedule = value => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => this.runSearch(value), 300);
        };

        // Search lives in the header now; it announces the term as an event so
        // the filtering here stays independent of where the field is drawn.
        window.addEventListener('site:search', event => {
            schedule(event.detail ? event.detail.term : '');
        });

        const searchInput = document.querySelector(this.searchInputSelector);
        if (searchInput) {
            searchInput.addEventListener('input', () => schedule(searchInput.value));
        }
    }

    runSearch(term) {
        term = String(term || '').trim();
        if (!term) {
            this.displayItems(this.allData);
            return;
        }

        const filtered = this.allData
            .map(item => {
                let matchCount = 0;
                const matcher = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                this.searchFields.forEach(field => {
                    if (matcher.test(String(item[field] || ''))) matchCount++;

                    // Also search in meta fields if they exist
                    if (item.meta && Array.isArray(item.meta)) {
                        item.meta.forEach(m => {
                            if (matcher.test(String(m.text || ''))) matchCount++;
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
                avatar.className = 'author_image';
                avatar.alt = item.author.name || '';
                avatar.setAttribute('decoding', 'async');
                avatar.src = item.author.image;
                authorBox.appendChild(avatar);
            }

            const nameBox = document.createElement('div');
            nameBox.className = 'AuthorName_and_Date';
            const nameEm = document.createElement('em');
            nameEm.appendChild(document.createTextNode(' By '));
            const nameLink = document.createElement('a');
            nameLink.href = safeHref(item.author.link, '#');
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
            doiLink.href = safeHref(item.link, '#');
            doiLink.target = '_blank';
            doiLink.rel = 'noopener noreferrer';
            appendHighlighted(doiLink, item.link, term);
            doiP.appendChild(doiLink);
            content.appendChild(doiP);
        }

        // The card image sits below the fold of a list page. When the data carries
        // its dimensions the space is reserved and the url waits in data-src until
        // the card is near the viewport (see observeCardImage). Without dimensions
        // there is nothing to reserve, and a deferred unsized image is exactly what
        // makes the list jump while scrolling, so that record keeps the behaviour
        // it had before this change: lazy hint, url on the element.
        if (item.image) {
            const figure = document.createElement('img');
            figure.className = 'publication-image';
            figure.setAttribute('decoding', 'async');
            if (item.image_width && item.image_height) {
                figure.width = item.image_width;
                figure.height = item.image_height;
                figure.setAttribute('loading', 'lazy');
                figure.dataset.src = item.image;
                card.appendChild(figure);
                observeCardImage(figure);
            } else {
                // No dimensions, so nothing tells us how tall the box will be: the
                // browser's own lazy loading defers the request instead, and the
                // card is never resized after insertion.
                figure.setAttribute('loading', 'lazy');
                figure.src = item.image;
                card.appendChild(figure);
            }
        }

        // A phone has no double click, so one tap opens the card. A publication
        // card points at its DOI, and a DOI is not a page to open by accident,
        // so those keep their own link and leave the card inert.
        const openOnTap = item.link && !item.link.includes('doi.org');
        if (openOnTap) {
            const destination = safeHref(item.link, '');
            if (destination) {
                card.addEventListener('click', (event) => {
                    if (event.target.closest('a')) return;
                    // A plain click leaves a collapsed caret inside the card,
                    // so only a non-empty selection counts as selecting text.
                    const selection = window.getSelection();
                    if (selection && !selection.isCollapsed && card.contains(selection.anchorNode)) return;
                    window.location.href = destination;
                });
            }
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
