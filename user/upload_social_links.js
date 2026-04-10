
/*---------------------------------------*\ 
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  fetch('/data/user_info.json')
    .then(response => {
      if (!response.ok) {
        console.error('Response not OK');
      }
      return response.json();
    })
    .then(data => {
      const socialContainer = document.querySelector('.social-links');
      data.social.forEach(account => {
        const a = document.createElement('a');
        a.href = account.url;
        a.target = '_blank';
        const img = document.createElement('img');
        img.src = account.icon;
        img.alt = account.name;
        a.appendChild(img);
        socialContainer.appendChild(a);
      });
    })
    .catch(error => console.error('Error loading contact info:', error));
});

