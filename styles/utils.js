/**
 * Shared utility for rendering list of cards with search and highlighting functionality.
 */
class CardRenderer {
    constructor(options) {
        this.dataUrl = options.dataUrl;
        this.listElementId = options.listElementId;
        this.countElementId = options.countElementId;
        this.searchInputSelector = options.searchInputSelector;
        this.renderCardFn = options.renderCardFn;
        this.searchFields = options.searchFields || [];
        this.itemTypeLabel = options.itemTypeLabel || 'item';
        
        this.allData = [];
        this.init();
    }

    async init() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.allData = await response.json();
            this.displayItems(this.allData);
            this.setupSearch();
        } catch (error) {
            console.error(`Error loading data from ${this.dataUrl}:`, error);
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
}

window.CardRenderer = CardRenderer;
