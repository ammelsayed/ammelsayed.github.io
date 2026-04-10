/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  new CardRenderer({
    dataUrl: '/data/blogs.json',
    listElementId: 'events-list',
    countElementId: 'event-count',
    searchInputSelector: '.search-input',
    itemTypeLabel: 'post',
    searchFields: ['title', 'author', 'date', 'description'],
    renderCardFn: (pub, term, highlight) => {
      const card = document.createElement('div');
      card.className = 'publication';
      card.style.cursor = 'pointer';

      const hTitle = highlight(pub.title, term);
      const hDesc = highlight(pub.description, term);
      const hAuthor = highlight(pub.author, term);
      const hDate = highlight(pub.date, term);

      card.innerHTML = `
        <div class="content">
          <h2>${hTitle}</h2>
          <div class="author_information">
            <img src="${pub.author_image}" class="author_image">
            <div class="AuthorName_and_Date">
              <em> By <a href="${pub.author_link}" target="_blank" rel="noopener">${hAuthor}</a>,</em>
              <em>${hDate}</em>
            </div>
          </div>
          <hr>
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
