document.addEventListener("DOMContentLoaded", function() {
  // Get references (keep simple, similar style)
  var header = document.querySelector('header');
  var headerMenu = document.querySelector('.header-menu');
  if (!headerMenu) return;

  var menuWrap = headerMenu.querySelector('.menu-button');      // wrapper div
  var btn = menuWrap.querySelector('button');                   // the actual button
  var menu = menuWrap.querySelector('.menu-navigations');       // the full-screen panel

  // Toggle menu open/close on click (morph button + show panel)
  btn.addEventListener('click', function (e) {
    var opened = menuWrap.classList.toggle('active');   // add .active to wrapper
    btn.classList.toggle('active', opened);             // keep same class on button too
    menu.classList.toggle('visible', opened);           // panel visible state

    // lock page scroll when open
    document.body.style.overflow = opened ? 'hidden' : '';
  });

  // close when clicking a link inside the menu (good UX on mobile)
  var links = menu.querySelectorAll('a');
  Array.prototype.forEach.call(links, function(link) {
    link.addEventListener('click', function() {
      menuWrap.classList.remove('active');
      btn.classList.remove('active');
      menu.classList.remove('visible');
      document.body.style.overflow = '';
    });
  });

  // close when clicking on the overlay area (outside the list)
  menu.addEventListener('click', function(e) {
    if (e.target === menu) {
      menuWrap.classList.remove('active');
      btn.classList.remove('active');
      menu.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });

  // close with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.classList.contains('visible')) {
      menuWrap.classList.remove('active');
      btn.classList.remove('active');
      menu.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });
});
