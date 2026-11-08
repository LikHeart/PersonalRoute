/* ============================================================
   common.js — общая логика для всех страниц
   ============================================================ */

(function () {
    'use strict';

    /* ---------- 1. Вывод реальной даты ---------- */
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

    function updateDate() {
        const el = document.getElementById('current-date');
        if (!el) return;
        const now = new Date();
        el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    }

    /* ---------- 2. Переключение фильтров (events) ---------- */
    function initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        if (!filterBtns.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    /* ---------- 3. Логотип — скролл наверх (main) ---------- */
    function initLogoScroll() {
        const logo = document.querySelector('.logo');
        if (!logo) return;
        logo.addEventListener('click', (e) => {
            const path = window.location.pathname;
            if (path === '/' || path === '/main') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    /* ---------- Инициализация ---------- */
    document.addEventListener('DOMContentLoaded', () => {
        updateDate();
        initFilters();
        initLogoScroll();
    });
})();