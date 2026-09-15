// script.js 
// reusable setup for any button + popup pair
function setupPopup(buttonId, popupId, titlebarId, closeId) {
  // gets ref to buttons and popup from html
  const button = document.getElementById(buttonId);
  const popup = document.getElementById(popupId);
  const titlebar = document.getElementById(titlebarId);
  const closeBtn = document.getElementById(closeId);

  // event listener for opening and closing popup
  button.addEventListener('click', () => {
    popup.classList.toggle('open');
  });
  closeBtn.addEventListener('click', () => {
    popup.classList.remove('open');
  });

  // making popup draggable element
  let isDragging = false;
  // store x and y where user grabs
  let userGrabX = 0;
  let userGrabY = 0;

  titlebar.addEventListener('pointerdown', (e) => {
    isDragging = true;
    const popupRect = popup.getBoundingClientRect();
    userGrabX = e.clientX - popupRect.left;
    userGrabY = e.clientY - popupRect.top;
    // tracking cursor
    titlebar.setPointerCapture(e.pointerId);
  });

  // moves the popup while dragging
  titlebar.addEventListener('pointermove', (e) => {
    if (!isDragging) {
      return;
    }
    // get object containing element screen position and size
    const parentRect = popup.parentElement.getBoundingClientRect();
    popup.style.left = (e.clientX - parentRect.left - userGrabX) + 'px';
    popup.style.top = (e.clientY - parentRect.top - userGrabY) + 'px';
  });

  // pointer up means stops dragging window
  titlebar.addEventListener('pointerup', () => {
    isDragging = false;
  });
}

// wire up both popups
setupPopup('aboutButton', 'aboutPopup', 'popupTitlebar', 'popupClose');
setupPopup('contactButton', 'contactPopup', 'contactTitlebar', 'contactClose');

// light and dark mode code was following yt tutorial
const html = document.documentElement;
const sunIcon = document.querySelector('.sun-icon');

// load saved preference or fall back to the user's OS setting
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let initialTheme;

if (savedTheme) {
  initialTheme = savedTheme;
} else if (prefersDark) {
  initialTheme = 'dark';
} else {
  initialTheme = 'light';
}
html.setAttribute('data-theme', initialTheme);

sunIcon.addEventListener('click', () => {
  // change themes when day/night changes
  const current = html.getAttribute('data-theme');
  // switch themes to opposite of current theme

  let next;
  if (current === 'dark') {
    next = 'light';
  } else {
    next = 'dark';
  }
  
  html.setAttribute('data-theme', next);
  // theme stays when page reloads
  localStorage.setItem('theme', next);
  updateMusicForTheme(next);
});

// volume button code snippet from tutorial
const bgMusic = document.getElementById('bgMusic');
const volumeButton = document.getElementById('volumeButton');
let isPlaying = false;

volumeButton.addEventListener('click', () => {
  if (isPlaying) {
    bgMusic.pause();
    volumeButton.src = 'img/volume-off-icon.png';
  } else {
    bgMusic.play();
    volumeButton.src = 'img/volume-icon.svg';
  }
  isPlaying = !isPlaying;
});

// function for playing music button
const nowPlayingText = document.getElementById('nowPlayingText');

function updateMusicForTheme(theme) {
  const wasPlaying = isPlaying;

  if (theme === 'dark') {
    bgMusic.src = bgMusic.dataset.nightSrc;
    nowPlayingText.textContent = '♬ playing: animal crossing - night ♪';
  } else {
    bgMusic.src = bgMusic.dataset.daySrc;
    nowPlayingText.textContent = '♬ playing: animal crossing - day ♪';
  }
  // resume if it were still playing
  if (wasPlaying) {
    bgMusic.play();
  }
}
