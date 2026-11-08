document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    const userName = localStorage.getItem('userName');

    // ================= ГОСТЕВОЙ ПРОФИЛЬ =================
    // Если мы на странице профиля и токена нет — просто ничего не скрываем.
    // Модалку можно вообще удалить из HTML или скрыть навсегда.
    if (window.location.pathname === '/profile') {
        const guestModal = document.getElementById('guest-modal');

        // Всегда скрываем модальное окно, так как профиль теперь доступен всем
        if (guestModal) {
            guestModal.style.display = 'none';
        }
    }

    // ================= ПОДСТАНОВКА ДАННЫХ =================
    const guestElements = document.querySelectorAll('.js-guest-only');
    const authElements = document.querySelectorAll('.js-auth-only');
    const nameElements = document.querySelectorAll('.js-user-name, .user-info strong');
    const avatarElements = document.querySelectorAll('.js-user-avatar, .user-avatar, .header-avatar');
    const statusElements = document.querySelectorAll('.user-info span, .sidebar-user-status');

    if (token) {
        // Если токен есть, но имя пустое — ставим "Пользователь" (чтобы не было "Гостя")
        const displayName = userName ? userName : "Пользователь";

        guestElements.forEach(el => el.style.display = 'none');
        authElements.forEach(el => {
            if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                el.style.display = 'inline-flex';
            } else {
                el.style.display = 'flex';
            }
        });

        nameElements.forEach(el => el.textContent = displayName);

        statusElements.forEach(el => {
            if (el.textContent.includes('Без регистрации') || el.textContent.includes('Гость')) {
                el.textContent = 'Студент ТПУ';
            }
        });

        // Инициалы
        const parts = displayName.trim().split(' ');
        let initials = 'П';
        if (parts.length >= 2) {
            initials = parts[0].charAt(0) + parts[1].charAt(0);
        } else if (parts.length === 1 && parts[0].length > 0) {
            initials = parts[0].charAt(0);
        }

        avatarElements.forEach(el => {
            el.textContent = initials.toUpperCase();
        });

    } else {
        guestElements.forEach(el => {
            if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                el.style.display = 'inline-flex';
            } else {
                el.style.display = 'flex';
            }
        });
        authElements.forEach(el => el.style.display = 'none');
    }

    // ================= ВЫХОД =================
    const logoutBtns = document.querySelectorAll('.js-logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userName');
            window.location.href = '/';
        });
    });
});