
// Removes "index.html" from the current URL path without reloading.

(function stripIndex() {
  const { pathname, search, hash } = window.location;
  if (pathname.endsWith('index.html')) {
    const cleanPath = pathname.slice(0, -'index.html'.length);
    window.history.replaceState(null, '', cleanPath + search + hash);
  }
})();

// Upload the headers 
class MyHeader extends HTMLElement {
    connectedCallback() {
        const navLinks = `
        <ul>
            <li><a href="/index.html" id="home">Home</a></li>
            <li><a href="/about/index.html" id="about">About</a></li>
            <li><a href="/docs/CV.pdf" target="_blank" id="cv_download">My CV</a></li>
            <li><a href="/publications/index.html" id="publications">Publications</a></li>
            <li><a href="/projects/index.html" id="projects">Projects</a></li>
            <li><a href="/blog/index.html" id="blog">Blog</a></li>
            <li><a href="/events/index.html" id="events">Events</a></li>
            <li><a href="/login.html" id="login">Login</a></li>
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
    }

    setupThemeToggle() {
        const toggleBtn = this.querySelector('#theme-toggle');
        const sunIcon = toggleBtn.querySelector('.sun-icon');
        const moonIcon = toggleBtn.querySelector('.moon-icon');
        
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateIcons(currentTheme, sunIcon, moonIcon);

        toggleBtn.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.updateIcons(theme, sunIcon, moonIcon);
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