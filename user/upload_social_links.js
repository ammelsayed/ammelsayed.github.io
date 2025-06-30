
/*---------------------------------------*\ 
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  fetch('/user/user_info.json')
    .then(response => {
      if (!response.ok) {
        console.error('Response not OK');
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Loaded data:', data);
      // Select the social links container using the class
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

