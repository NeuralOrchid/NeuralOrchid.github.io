// -- Script for mobile side menu toggle --
const sideMenu = document.getElementById('sideMenu');
const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');

openMenu.addEventListener('click', () => {
    sideMenu.classList.remove('translate-y-full');
    openMenu.classList.add('translate-y-full');
});

closeMenu.addEventListener('click', () => {
    sideMenu.classList.add('translate-y-full');
    openMenu.classList.remove('translate-y-full');
});