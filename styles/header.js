
// Removes "index.html" from the current URL path without reloading.
(function stripIndex() {
  const { pathname, search, hash } = window.location;
  if (pathname.endsWith('index.html')) {
    const cleanPath = pathname.slice(0, -'index.html'.length);
    window.history.replaceState(null, '', cleanPath + search + hash);
  }
})();

import { createSiteSearch } from './search.js';

// Upload the headers 
class MyHeader extends HTMLElement {
    connectedCallback() {
        // Check if user is logged in
        const isLoggedIn = sessionStorage.getItem('isAdmin') === 'true';        const loginText = isLoggedIn ? 'Logout' : 'Login';
        const loginHref = isLoggedIn ? 'javascript:logoutFromHeader()' : '/login.html';
        
        const navLinks = `
        <ul>
            <li><a href="/index.html" id="home">Home</a></li>
            <li><a href="/about/index.html" id="about">About</a></li>
            <li><a href="/publications/index.html" id="publications">Publications</a></li>
            <li><a href="/projects/index.html" id="projects">Projects</a></li>
            <li><a href="/blog/index.html" id="blog">Blog</a></li>
            <li><a href="/events/index.html" id="events">Events</a></li>
            <li><a href="/docs/CV.pdf" target="_blank" id="cv_download">My CV</a></li>
            <!-- <li><a href="${loginHref}" id="login">${loginText}</a></li> -->
        </ul>`;

        this.innerHTML = `    
        <header>
            <div class="inner-header">
                <!--Logo goes here-->
                <div class="logo-container">
                    <a href="/index.html">
                        <img src="/images/tap-icon.png" alt="Logo">
                        <h1>&Lambda;MM<span>Elsayed</span></h1>
                    </a>
                </div>

                <!--Navigation links goes here-->
                <div class="navigations">
                    <nav>${navLinks}</nav>
                    <button class="header-searchbtn" id="header-search" type="button" aria-label="Search" aria-expanded="false">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                        </svg>
                    </button>
                    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle light/dark theme">
                        <svg class="sun-icon" viewBox="0 0 24 24" style="display: none;">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <svg class="moon-icon" viewBox="0 0 24 24">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    </button>
                </div>

                <!--Menu goes here -->
                <div class="header-menu">
                    <div class="menu-button">
                        <button>
                            <span class="line"></span>
                            <span class="line"></span>
                        </button>

                        <div class="menu-navigations">
                            <nav>${navLinks}</nav>
                        </div>
                    </div>
                </div>
            </div>
        </header>`;

        this.highlightActiveLink();
        this.setupThemeToggle();
        this.setupSearch();
        
        // Add logout function to window so it can be called from the link
        if (!window.logoutFromHeader) {
            window.logoutFromHeader = () => {
                sessionStorage.removeItem('isAdmin');
                window.location.href = '/login.html';
            };
        }
    }

    setupThemeToggle() {
        const toggleBtn = this.querySelector('#theme-toggle');
        const sunIcon = toggleBtn.querySelector('.sun-icon');
        const moonIcon = toggleBtn.querySelector('.moon-icon');
        
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateIcons(currentTheme, sunIcon, moonIcon);

        toggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.updateIcons(theme, sunIcon, moonIcon);
        });
    }

    // The field covers the bar and the results hang under it. Both are what the
    // reader sees while searching; the index behind them covers every page, so
    // the same control works on an article, a list page or the home page. On the
    // list pages the query still filters the cards behind the panel, which is
    // why the event is kept.
    setupSearch() {
        const placeholder = 'Search posts, publications, projects…';
        const header = this.querySelector('header');
        const trigger = this.querySelector('#header-search');

        const layer = document.createElement('div');
        layer.className = 'header-search';
        layer.hidden = true;
        layer.innerHTML = `
            <form class="header-search-form" role="search">
                <svg class="header-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                </svg>
                <input class="header-search-field" type="search" autocomplete="off" spellcheck="false">
                <button class="header-search-close" type="button" aria-label="Close search">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                    </svg>
                </button>
            </form>`;
        header.appendChild(layer);

        const field = layer.querySelector('.header-search-field');
        field.placeholder = placeholder;
        field.setAttribute('aria-label', placeholder);

        let results;

        const emit = () => {
            window.dispatchEvent(new CustomEvent('site:search', { detail: { term: field.value } }));
        };

        // menu.js owns the panel and the scroll lock, and it has no close of its
        // own, so the three states it toggles are undone here before the field
        // covers the bar.
        const closeMenu = () => {
            const wrap = this.querySelector('.menu-button');
            const panel = this.querySelector('.menu-navigations');
            if (wrap) wrap.classList.remove('active');
            if (wrap) {
                const btn = wrap.querySelector('button');
                if (btn) btn.classList.remove('active');
            }
            if (panel) panel.classList.remove('visible');
            document.body.style.overflow = '';
        };

        const close = () => {
            if (layer.hidden) return;
            layer.hidden = true;
            if (results) results.hide();
            trigger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            if (field.value) {
                field.value = '';
                emit();
            }
            // preventScroll keeps the reader where they were: focusing the icon
            // would otherwise jump the page back to the top.
            trigger.focus({ preventScroll: true });
        };

        results = createSiteSearch(field, { onDismiss: () => close() });

        const open = () => {
            closeMenu();
            layer.hidden = false;
            // The bar is the anchor for both the field and the panel, so its
            // measured height keeps them together on phones and on desktop.
            layer.style.height = `${header.getBoundingClientRect().height}px`;
            trigger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            results.show();
            results.update(field.value);
            field.focus();
        };

        // The field covers the icon while it is open, so the icon only opens it;
        // the close button, Escape and a click outside are what dismiss it.
        trigger.addEventListener('click', open);

        field.addEventListener('input', () => {
            emit();
            results.update(field.value);
        });
        field.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        });
        layer.querySelector('form').addEventListener('submit', e => e.preventDefault());
        layer.querySelector('.header-search-close').addEventListener('click', close);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !layer.hidden) close();
            // Ctrl/⌘K is the shortcut readers expect for a site search.
            if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) {
                e.preventDefault();
                if (layer.hidden) open();
            }
        });
        window.addEventListener('resize', () => {
            if (layer.hidden) return;
            layer.style.height = `${header.getBoundingClientRect().height}px`;
            results.layout();
        });
    }

    updateIcons(theme, sunIcon, moonIcon) {
        if (theme === 'light') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    highlightActiveLink() {
        const currentPath = window.location.pathname;
        const links = this.querySelectorAll('nav a');
        links.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (currentPath === linkPath || (currentPath === '/' && linkPath === '/index.html')) {
                link.classList.add('active');
            }
        });
    }
}
customElements.define('my-header', MyHeader)