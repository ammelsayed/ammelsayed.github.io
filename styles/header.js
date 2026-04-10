
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
            <li><a href="/appointment/index.html" id="appointment">Appointment</a></li>
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