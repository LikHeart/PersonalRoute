document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        function updateThemeLabel() {
            const isDark = document.documentElement.classList.contains('dark');
            toggle.textContent = isDark ? '☀ / Светлая' : '☼ / Тёмная';
        }

        updateThemeLabel();

        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('my-route-theme', isDark ? 'dark' : 'light');
            updateThemeLabel();
        });
    }
});