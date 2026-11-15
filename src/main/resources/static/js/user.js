document.addEventListener('DOMContentLoaded', async () => {
    let token = localStorage.getItem('jwtToken');
    let userName = localStorage.getItem('userName');

    // ================= ПРОВЕРКА ВАЛИДНОСТИ ТОКЕНА =================
    if (token) {
        try {
            const res = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Token is invalid or expired');
            }
        } catch (e) {
            console.warn('Сессия истекла или токен невалиден. Сбрасываем авторизацию.');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('chatConversationId');

            token = null;
            userName = null;

            if (window.location.pathname === '/profile' || window.location.pathname === '/dashboard') {
                window.location.href = '/';
                return;
            }
        }
    }

    // ================= ГОСТЕВОЙ ПРОФИЛЬ =================
    if (window.location.pathname === '/profile') {
        const guestModal = document.getElementById('guest-modal');
        if (guestModal) {
            guestModal.style.display = 'none';
        }
    }

    // ================= ЭЛЕМЕНТЫ ИНТЕРФЕЙСА =================
    const guestElements = document.querySelectorAll('.js-guest-only');
    const authElements = document.querySelectorAll('.js-auth-only');
    const nameElements = document.querySelectorAll('.js-user-name, .user-info strong');
    const avatarElements = document.querySelectorAll('.js-user-avatar, .user-avatar, .header-avatar');
    const statusElements = document.querySelectorAll('.user-info span, .sidebar-user-status');

    // ================= ПОДСТАНОВКА ДАННЫХ =================
    if (token) {
        // Пользователь авторизован
        const displayName = userName ? userName : "Пользователь";

        // Скрываем гостевые элементы, показываем элементы для авторизованных
        guestElements.forEach(el => el.style.display = 'none');
        authElements.forEach(el => {
            if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                el.style.display = 'inline-flex';
            } else {
                el.style.display = 'flex';
            }
        });

        // Подставляем имя
        nameElements.forEach(el => el.textContent = displayName);

        // Меняем статус
        statusElements.forEach(el => {
            if (el.textContent.includes('Без регистрации') || el.textContent.includes('Гость')) {
                el.textContent = 'Студент ТПУ';
            }
        });

        // Генерируем инициалы для аватара
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
        // Пользователь — гость
        guestElements.forEach(el => {
            if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                el.style.display = 'inline-flex';
            } else {
                el.style.display = 'flex';
            }
        });
        authElements.forEach(el => el.style.display = 'none');
    }

    // ================= ПЛАВНОЕ ПОЯВЛЕНИЕ ДАННЫХ =================
    // Убираем класс невидимости после того, как данные подставлены
    const hiddenElements = document.querySelectorAll('.user-data-hidden');
    hiddenElements.forEach(el => {
        el.classList.remove('user-data-hidden');
    });

    // ================= ВЫХОД ИЗ АККАУНТА =================
    const logoutBtns = document.querySelectorAll('.js-logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Очищаем localStorage от всех данных сессии
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('chatConversationId');

            // Перенаправляем на главную
            window.location.href = '/';
        });
    });
});