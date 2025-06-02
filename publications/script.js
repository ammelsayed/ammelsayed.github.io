/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

// Store publications data globally
let publicationsData = [];

// Fetch and store JSON data
function fetchJSONData() {
    fetch('publications/publications.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            publicationsData = data;
            // On initial load, show all
            displayPublications(publicationsData);
        })
        .catch(error => console.error('Error loading publications:', error));
}

// Helper: create or update the count line
function updatePublicationCounts(currentCount, totalCount) {
    const countsEl = document.getElementById('publication-count');
    countsEl.innerHTML = `<i>Showing <b>${currentCount}</b> out of <b>${totalCount}</b> published works.</i>`;
}

// Display publications without filtering or highlighting
function displayPublications(data) {
    // 1) update the counts (all displayed = total)
    updatePublicationCounts(data.length, publicationsData.length);

    // 2) render
    const publicationsList = document.getElementById('publications-list');
    publicationsList.innerHTML = '';
    data.forEach(pub => {
        const pubElement = document.createElement('div');
        pubElement.classList.add('publication');
        pubElement.innerHTML = `
            <div class="content">
                <p style="color: navy;"><em><b>${pub.paper_type}</b></em></p>
                <h2>${pub.title}</h2>
                <p><em>${pub.date}, ${pub.journal}</em></p>
                <p id="abstract"><b>Abstract:</b> ${pub.description}</p>
                <p id="doi-link"><b>DOI:</b>
                   <a href="${pub.link}" target="_blank">${pub.link}</a>
                </p>
            </div>
            <img src="${pub.image_soruce}" class="publication-image">
        `;
        publicationsList.appendChild(pubElement);
    });
}

// Capture search input
const searchInput = document.querySelector('.search-input');

// Add real-time search with debouncing
let debounceTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(performSearch, 300);
});

function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        // no term → show all
        return displayPublications(publicationsData);
    }

    // Build filtered & sorted list
    const filteredData = publicationsData
        .map(pub => {
            let matchCount = 0;
            ['paper_type','title','date','journal','description','link']
                .forEach(fld => {
                    if (pub[fld].toLowerCase().includes(searchTerm)) matchCount++;
                });
            return { pub, matchCount };
        })
        .filter(item => item.matchCount > 0)
        .sort((a,b) => b.matchCount - a.matchCount)
        .map(item => item.pub);

    displayPublicationsWithHighlights(filteredData, searchTerm);
}

// Display with highlights + update count
function displayPublicationsWithHighlights(data, searchTerm) {
    updatePublicationCounts(data.length, publicationsData.length);

    const publicationsList = document.getElementById('publications-list');
    publicationsList.innerHTML = '';
    data.forEach(pub => {
        const pubElement = document.createElement('div');
        pubElement.classList.add('publication');
        pubElement.innerHTML = `
            <div class="content">
                <p style="color: navy;">
                  <em><b>${highlightText(pub.paper_type, searchTerm)}</b></em>
                </p>
                <h2>${highlightText(pub.title, searchTerm)}</h2>
                <p><em>
                  ${highlightText(pub.date, searchTerm)}, 
                  ${highlightText(pub.journal, searchTerm)}
                </em></p>
                <p id="abstract">
                  <b>Abstract:</b> ${highlightText(pub.description, searchTerm)}
                </p>
                <p id="doi-link">
                  <b>DOI:</b>
                  <a href="${pub.link}" target="_blank">
                    ${highlightText(pub.link, searchTerm)}
                  </a>
                </p>
            </div>
            <img src="${pub.image_soruce}" class="publication-image">
        `;
        publicationsList.appendChild(pubElement);
    });
}

// Utility to wrap matches in a <span>
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Kick things off
document.addEventListener('DOMContentLoaded', () => {
    fetchJSONData(); // ← move your init call here
});
