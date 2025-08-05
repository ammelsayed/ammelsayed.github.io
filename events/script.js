let publicationsData = [];

function fetchJSONData() {
    fetch('events.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            publicationsData = data;
            displayPublications(publicationsData);
        })
        .catch(error => console.error('Error loading events:', error));
}

function updatePublicationCounts(currentCount, totalCount) {
    const countsEl = document.getElementById('event-count');
    countsEl.innerHTML = `<i>Showing <b>${currentCount}</b> out of <b>${totalCount}</b> event(s).</i>`;
}

function displayPublications(data) {
    updatePublicationCounts(data.length, publicationsData.length);
    const publicationsList = document.getElementById('events-list');
    publicationsList.innerHTML = '';
    data.forEach(pub => {
        const pubElement = document.createElement('div');
        pubElement.classList.add('publication');
        pubElement.innerHTML = `
            <div class="content">
                <h2>${pub.title}</h2>
                <p>
                    🗓️ <em>${pub.date}</em>
                    📍 <em>${pub.location}</em>
                </p>
                <p id="abstract">${pub.description}</p>
            </div>
            <img src="${pub.image_soruce}" class="publication-image">
        `;
        publicationsList.appendChild(pubElement);
    });
}

const searchInput = document.querySelector('.search-input');
let debounceTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(performSearch, 300);
});

function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) return displayPublications(publicationsData);

    const filteredData = publicationsData
        .map(pub => {
            let matchCount = 0;
            ['title','date','location','description'].forEach(fld => {
                if (pub[fld].toLowerCase().includes(searchTerm)) matchCount++;
            });
            return { pub, matchCount };
        })
        .filter(item => item.matchCount > 0)
        .sort((a,b) => b.matchCount - a.matchCount)
        .map(item => item.pub);

    displayPublicationsWithHighlights(filteredData, searchTerm);
}

function displayPublicationsWithHighlights(data, searchTerm) {
    updatePublicationCounts(data.length, publicationsData.length);
    const publicationsList = document.getElementById('events-list');
    publicationsList.innerHTML = '';
    data.forEach(pub => {
        const pubElement = document.createElement('div');
        pubElement.classList.add('publication');
        pubElement.innerHTML = `
            <div class="content">
                <h2>${highlightText(pub.title, searchTerm)}</h2>
                <p>
                    🗓️ <em>${highlightText(pub.date, searchTerm)}</em>
                    📍 <em>${highlightText(pub.location, searchTerm)}</em>
                </p>
                <p id="abstract">
                    ${highlightText(pub.description, searchTerm)}
                </p>
            </div>
            <img src="${pub.image_soruce}" class="publication-image">
        `;
        publicationsList.appendChild(pubElement);
    });
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Lightbox setup
const overlay = document.getElementById('lightbox-overlay');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(imgEl) {
    lightboxImage.src = imgEl.src;
    const desc = imgEl.previousElementSibling?.querySelector('#abstract') || 
                 imgEl.closest('.publication')?.querySelector('#abstract');
    document.getElementById('lightbox-description-text').textContent = desc ? desc.textContent : '';
    overlay.style.display = 'flex';
    document.body.classList.add('lightbox-active');
}


function closeLightbox() {
    overlay.style.display = 'none';
    document.body.classList.remove('lightbox-active');
}

document.getElementById('events-list').addEventListener('dblclick', e => {
    if (e.target.classList.contains('publication-image')) {
        openLightbox(e.target);
    }
});

lightboxClose.addEventListener('click', closeLightbox);
overlay.addEventListener('click', e => {
    if (e.target === overlay) closeLightbox();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchJSONData();
});
