/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  new CardRenderer({
    dataUrl: '/data/events.json',
    listElementId: 'events-list',
    countElementId: 'event-count',
    searchInputSelector: '.search-input',
    itemTypeLabel: 'event',
    searchFields: ['title', 'date', 'location', 'description'],
    renderCardFn: (pub, term, highlight) => {
      const card = document.createElement('div');
      card.className = 'publication';

      const hTitle = highlight(pub.title, term);
      const hDate = highlight(pub.date, term);
      const hLocation = highlight(pub.location, term);
      const hDesc = highlight(pub.description, term);

      card.innerHTML = `
        <div class="content">
          <h2>${hTitle}</h2>
          <p>
            🗓️ <em>${hDate}</em>
            📍 <em>${hLocation}</em>
          </p>
          <p id="abstract">${hDesc}</p>
        </div>
        <img src="${pub.image_soruce}" class="publication-image">
      `;

      return card;
    }
  });
});
