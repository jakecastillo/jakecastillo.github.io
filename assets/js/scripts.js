// dl-menu options
$(function() {
  $( '#dl-menu' ).dlmenu({
    animationClasses : { classin : 'dl-animate-in', classout : 'dl-animate-out' }
  });
});
// Need this to show animation when go back in browser
window.onunload = function() {};

// Add lightbox class to all image links
$("a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']").addClass("image-popup");

// FitVids options
$(function() {
  $(".content").fitVids();
});

// All others
$(document).ready(function() {
    // zoom in/zoom out animations
    if ($(".container").hasClass('fadeOut')) {
        $(".container").removeClass("fadeOut").addClass("fadeIn");
    }
    if ($(".wrapper").hasClass('fadeOut')) {
        $(".wrapper").removeClass("fadeOut").addClass("fadeIn");
    }
    $(".zoombtn").click(function() {
        $(".container").removeClass("fadeIn").addClass("fadeOut");
        $(".wrapper").removeClass("fadeIn").addClass("fadeOut");
    });
    // go up button
    $.goup({
        trigger: 500,
        bottomOffset: 10,
        locationOffset: 20,
        containerRadius: 0,
        containerColor: '#fff',
        arrowColor: '#000',
        goupSpeed: 'normal'
    });
	$('.image-popup').magnificPopup({
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 300, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open. 
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: 'mfp-fade'
  });
});

(function () {
  var storageKey = 'preferred-theme';
  var root = document.documentElement;

  function readStoredTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Ignore write errors (for example, in private mode)
    }
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      return 'dark';
    }
    root.removeAttribute('data-theme');
    return 'light';
  }

  function updateToggleUI(toggle, icon, text, theme) {
    var isDark = theme === 'dark';
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    if (icon) {
      icon.textContent = isDark ? '🌙' : '☀️';
    }
    if (text) {
      text.textContent = isDark ? 'Dark mode: on' : 'Dark mode: off';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) {
      return;
    }

    var icon = toggle.querySelector('.theme-toggle__icon');
    var text = toggle.querySelector('.theme-toggle__text');
    var storedPreference = readStoredTheme();
    var currentTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var mediaQuery;

    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (!storedPreference && mediaQuery.matches && currentTheme !== 'dark') {
        currentTheme = applyTheme('dark');
      }
    } catch (error) {
      mediaQuery = null;
    }

    updateToggleUI(toggle, icon, text, currentTheme);

    toggle.addEventListener('click', function () {
      var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      currentTheme = applyTheme(nextTheme);
      writeStoredTheme(currentTheme);
      updateToggleUI(toggle, icon, text, currentTheme);
    });

    if (!mediaQuery) {
      return;
    }

    var handlePreferenceChange = function (event) {
      if (readStoredTheme()) {
        return;
      }
      currentTheme = applyTheme(event.matches ? 'dark' : 'light');
      updateToggleUI(toggle, icon, text, currentTheme);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handlePreferenceChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handlePreferenceChange);
    }
  });
})();
