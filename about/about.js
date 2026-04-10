document.addEventListener("DOMContentLoaded", async () => {
    const contentEl = document.getElementById('about-content');
    
    try {
        const response = await fetch('/data/about.md');
        if (!response.ok) throw new Error('Failed to load about.md');
        const markdown = await response.text();
        
        // Custom renderer to handle images and structure
        const renderer = new marked.Renderer();
        
        // Customize how images are rendered to match the professional look
        renderer.image = (href, title, text) => {
            return `<img src="${href}" alt="${text}" title="${title || ''}" class="about-inline-image">`;
        };

        marked.setOptions({ renderer });
        contentEl.innerHTML = marked.parse(markdown);

        // Post-processing to group content into sections for better styling
        const sections = [];
        let currentSection = null;

        Array.from(contentEl.children).forEach(child => {
            if (child.tagName === 'H1') {
                currentSection = document.createElement('section');
                currentSection.className = 'about-section';
                const h2 = document.createElement('h2');
                h2.textContent = child.textContent;
                currentSection.appendChild(h2);
                sections.push(currentSection);
            } else if (currentSection) {
                currentSection.appendChild(child.cloneNode(true));
            }
        });

        if (sections.length > 0) {
            contentEl.innerHTML = '';
            sections.forEach(sec => contentEl.appendChild(sec));
        }

    } catch (error) {
        console.error('Error:', error);
        contentEl.innerHTML = `<p style="color:red">Error loading about content: ${error.message}</p>`;
    }
});
