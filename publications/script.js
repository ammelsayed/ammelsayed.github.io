/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  new CardRenderer({
    dataUrl: '/data/publications.json',
    listElementId: 'publications-list',
    countElementId: 'publication-count',
    searchInputSelector: '.search-input',
    itemTypeLabel: 'published work',
    searchFields: ['paper_type', 'title', 'date', 'journal', 'description', 'link'],
    renderCardFn: (pub, term, highlight) => {
      const card = document.createElement('div');
      card.className = 'publication';

      const hType = highlight(pub.paper_type, term);
      const hTitle = highlight(pub.title, term);
      const hDate = highlight(pub.date, term);
      const hJournal = highlight(pub.journal, term);
      const hDesc = highlight(pub.description, term);
      const hLink = highlight(pub.link, term);

      card.innerHTML = `
        <div class="content">
          <p style="color: navy;"><em><b>${hType}</b></em></p>
          <h2>${hTitle}</h2>
          <p><em>${hDate}, ${hJournal}</em></p>
          <p id="abstract"><b>Abstract:</b> ${hDesc}</p>
          <p id="doi-link"><b>DOI:</b>
             <a href="${pub.link}" target="_blank">${hLink}</a>
          </p>
        </div>
        <img src="${pub.image_soruce}" target="_blank" class="publication-image">
      `;

      return card;
    }
  });
});
