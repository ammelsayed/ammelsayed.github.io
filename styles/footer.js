class MyFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `    
            
            <footer>
                <div class="inner-footer">
                    <p>
                        &copy 2025 <b>A.M.M. Elsayed</b>. All rights reserved.
                    </p>
                    <div class="social-links"></div>
                </div>
            </footer>
    `
    }
}
customElements.define('my-footer',MyFooter)