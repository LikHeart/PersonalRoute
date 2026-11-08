/* ============================================================
   landing.js — логика главной страницы
   ============================================================ */

const logo = document.querySelector('.logo');

if (logo) {
    logo.addEventListener('click', (e) => {
        const path = window.location.pathname;
        if (path === '/' || path === '/main') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}