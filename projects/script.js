/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  new CardRenderer({
    dataUrl: '/data/projects.json',
    listElementId: 'events-list',
    countElementId: 'event-count',
    searchInputSelector: '.search-input',
    itemTypeLabel: 'project',
    searchFields: ['title', 'type', 'description'],
    renderCardFn: (pub, term, highlight) => {
      const card = document.createElement('div');
      card.className = 'publication';
      card.style.cursor = 'pointer';

      const hType = highlight(pub.type, term);
      const hTitle = highlight(pub.title, term);
      const hDesc = highlight(pub.description, term);

      card.innerHTML = `
        <div class="content">
          <p style="color: navy;"><em><b>${hType}</b></em></p>
          <h2>${hTitle}</h2>
          <p class="abstract">${hDesc}</p>
        </div>
        <img src="${pub.image_soruce}" class="publication-image">
      `;

      card.addEventListener('dblclick', () => {
        window.location.href = pub.link;
      });

      return card;
    }
  });
});
