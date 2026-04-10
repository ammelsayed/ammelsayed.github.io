
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
      document.getElementById('email').innerText = data.email;
      document.getElementById('phone').innerText = data.phone;
      document.getElementById('address').innerText = data.address;
      document.getElementById('email-icon').src = data.icons.email;
      document.getElementById('phone-icon').src = data.icons.phone;
      document.getElementById('address-icon').src = data.icons.address;
    })
    .catch(error => console.error('Error loading contact info:', error));
});

