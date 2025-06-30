document.addEventListener("DOMContentLoaded", function() {
  // Get references to the header element, header-menu container, the button, and the nested menu
  var header = document.querySelector('header');
  var headerMenu = document.querySelector('.header-menu');
  var btn = headerMenu.querySelector('.menu-button button');
  var menu = headerMenu.querySelector('.menu-button .menu-navigations');

  // Set a smooth transition for header background changes
  header.style.transition = 'background-color 0.5s ease';

  // Helper to update header background
  function setHeaderBackground(color) {
    header.style.backgroundColor = color;
  }

  // Show the menu and update header background when mouse hovers over the button
  btn.addEventListener('mouseenter', function() {
    menu.classList.add('visible');
    btn.style.borderRadius = '40px';
    btn.classList.add('active');
    setHeaderBackground('#202020'); // Change header to button's background color
  });

  // When mouse leaves the header-menu area, hide the menu and reset styles and header background
  headerMenu.addEventListener('mouseleave', function() {
    menu.classList.remove('visible');
    btn.style.borderRadius = '20px';
    btn.classList.remove('active');
    setHeaderBackground('#101010'); // Reset header background to original
  });
});
