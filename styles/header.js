class MyHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `    
        <header>
            <div class="inner-header">
            <!--Logo goes here-->
            <div class="logo-container">
                <img src="images/logo.png" alt="Logo">
                <h1>&Lambda;MM<span>Elsayed</span></h1>
            </div>
            <!--Navigation links goes here-->
            <div class="navigations">
                <nav>
                    <ul>
                        <li>
                            <a href= "./index.html" id="home">
                                Home
                            </a>
                        </li>
                        <li>
                            <a href="./about.html" id="about">
                                About
                            </a>
                        </li>
                        <li>
                            <a href="./publications.html" id="publications">
                                Publications
                            </a>
                        </li>
                        <li>
                            <a href="./projects.html" id="cv">
                                Projects
                            </a>
                        </li>
                        <li>
                            <a href="./blog.html" id="blog">
                                Blog
                            </a>
                        </li>
                        <li>
                            <a href="./events.html" id="events">
                                Events
                            </a>
                        </li>
                        <li>       
                           <a href="./contact_me.html" id="contact_me">        
                                Contact  
                           </a>       
                        </li>      

                    </ul>
                </nav>
            </div>

            <!--Menu goes here -->

            <div class="header-menu">

                <div class="menu-button">
                    <button>
                        <span class="line"></span>
                        <span class="line"></span>
                        <span class="line"></span>
                    </button>

                    <div class="menu-navigations">
                        <nav>
                            <ul>
                                <li>
                                    <a href= "./index.html" id="home">
                                        Home
                                    </a>
                                </li>
                                <li>
                                    <a href="./about.html" id="about">
                                        About
                                    </a>
                                </li>
                                <li>
                                    <a href="./publications.html" id="publications">
                                        Publications
                                    </a>
                                </li>
                                <li>
                                    <a href="./projects.html" id="cv">
                                        Projects
                                    </a>
                                </li>
                                <li>
                                    <a href="./blog.html" id="blog">
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <a href="./events.html" id="events">
                                        Events
                                    </a>
                                </li>
                                <li>      
                                    <a href="./contact_me.html" id="contact_me">      
                                         Contact  
                                    </a>      
                                </li>     
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
        </header>
    `
    }
}

customElements.define('my-header',MyHeader)
