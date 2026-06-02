/**
 * Unified Content Loader
 * Automatically initializes CardRenderer for Blog, Projects, Events, and Publications.
 * Standardizes element IDs across all pages.
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.toLowerCase();
    let config = null;

    if (path.includes('/blog')) {
        config = {
            dataUrl: '/data/blogs.json',
            listElementId: 'content-list',
            countElementId: 'content-count',
            searchInputSelector: '.search-input',
            itemTypeLabel: 'post'
        };
    } else if (path.includes('/projects')) {
        config = {
            dataUrl: '/data/projects.json',
            listElementId: 'content-list',
            countElementId: 'content-count',
            searchInputSelector: '.search-input',
            itemTypeLabel: 'project'
        };
    } else if (path.includes('/events')) {
        config = {
            dataUrl: '/data/events.json',
            listElementId: 'content-list',
            countElementId: 'content-count',
            searchInputSelector: '.search-input',
            itemTypeLabel: 'event'
        };
    } else if (path.includes('/publications')) {
        config = {
            dataUrl: '/data/publications.json',
            listElementId: 'content-list',
            countElementId: 'content-count',
            searchInputSelector: '.search-input',
            itemTypeLabel: 'published work'
        };
    }

    if (config) {
        new CardRenderer(config);
    }
});
