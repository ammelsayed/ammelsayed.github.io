/**
 * Shared utility for rendering list of cards with search and highlighting functionality.
 * Supports a unified content schema for easy scaling across different sections.
 */
class CardRenderer {
    constructor(options) {
        this.dataUrl = options.dataUrl;
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
            const response = await fetch(this.dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.allData = await response.json();
            
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
            if (listEl) listEl.innerHTML = `<p style="color:red">Failed to load content: ${error.message}</p>`;
        }
    }

    updateCounts(current, total) {
        const countEl = document.getElementById(this.countElementId);
        if (countEl) {
            countEl.innerHTML = `<i>Showing <b>${current}</b> out of <b>${total}</b> ${this.itemTypeLabel}(s).</i>`;
        }
    }

    displayItems(data, searchTerm = '') {
        const listEl = document.getElementById(this.listElementId);
        if (!listEl) return;

        listEl.innerHTML = '';
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
    defaultRenderCard(item, term, highlight) {
        const card = document.createElement('div');
        card.className = 'publication'; // Using existing class for styling consistency
        if (item.link) card.style.cursor = 'pointer';

        const hTitle = highlight(item.title, term);
        const hDesc = highlight(item.description, term);
        const hBadge = item.badge ? highlight(item.badge, term) : '';
        
        // Handle meta fields
        let metaHtml = '';
        if (item.meta && Array.isArray(item.meta)) {
            metaHtml = item.meta.map(m => `
                <span>${m.icon || ''} <em>${highlight(m.text, term)}</em></span>
            `).join(' ');
        }

        // Handle author info (for blogs)
        let authorHtml = '';
        if (item.author) {
            authorHtml = `
                <div class="author_information">
                    ${item.author.image ? `<img src="${item.author.image}" class="author_image">` : ''}
                    <div class="AuthorName_and_Date">
                        <em> By <a href="${item.author.link || '#'}" target="_blank" rel="noopener">${highlight(item.author.name, term)}</a></em>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="content">
                ${hBadge ? `<p class="badge-container"><em><b>${hBadge}</b></em></p>` : ''}
                <h2>${hTitle}</h2>
                ${authorHtml}
                ${metaHtml ? `<p>${metaHtml}</p>` : ''}
                <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--border-color);">
                <p class="abstract">${hDesc}</p>
                ${item.link && item.link.includes('doi.org') ? `<p id="doi-link"><b>DOI:</b> <a href="${item.link}" target="_blank">${highlight(item.link, term)}</a></p>` : ''}
            </div>
            ${item.image ? `<img src="${item.image}" class="publication-image">` : ''}
        `;

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

