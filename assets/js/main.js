// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('.tab-group');
      group.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      group.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Carousel
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var slides = carousel.querySelectorAll('.carousel-slide');
    var idx = 0;
    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    }
    var prev = carousel.querySelector('.carousel-btn.prev');
    var next = carousel.querySelector('.carousel-btn.next');
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
  });
});
