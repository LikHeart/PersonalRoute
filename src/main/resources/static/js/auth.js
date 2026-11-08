document.addEventListener('DOMContentLoaded', () => {
    const tabRegister = document.getElementById('tab-register');
    const tabLogin    = document.getElementById('tab-login');

    const formTitle    = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtn    = document.getElementById('submit-btn');
    const footerText   = document.getElementById('footer-toggle-text');

    const groupName            = document.getElementById('group-name');
    const groupPasswordConfirm = document.getElementById('group-password-confirm');
    const groupAgreement       = document.getElementById('group-agreement');
    const groupCode            = document.getElementById('group-code');

    const inputEmail    = document.getElementById('email');
    const inputPassword = document.getElementById('password');
    const inputConfirm  = document.getElementById('password-confirm');
    const inputName     = document.getElementById('name');

    const errEmail    = document.getElementById('email-error');
    const errPassword = document.getElementById('password-error');
    const errConfirm  = document.getElementById('password-confirm-error');

    const formAlert     = document.getElementById('form-alert');
    const formAlertText = document.getElementById('form-alert-text');

    const form = document.getElementById('register-form');
    let stage = 'idle';
    let isLoginMode = false;

    function showAlert(text, type = 'success') {
        formAlertText.textContent = text;
        formAlert.className = 'form-alert ' + type;
        formAlert.style.display = 'flex';
    }

    function hideAlert() {
        formAlert.style.display = 'none';
        formAlert.className = 'form-alert';
    }

    // Валидация...
    function validateEmail() {
        const val = inputEmail.value.trim();
        const isValid = val.endsWith('@tpu.ru') && val.length > 7;
        if (val.length > 0 && !isValid) {
            inputEmail.classList.add('error');
            errEmail.classList.add('visible');
            return false;
        } else {
            inputEmail.classList.remove('error');
            errEmail.classList.remove('visible');
            return true;
        }
    }

    function validatePassword() {
        const val = inputPassword.value;
        const isValid = val.length >= 8;
        if (val.length > 0 && !isValid) {
            inputPassword.classList.add('error');
            errPassword.classList.add('visible');
            return false;
        } else {
            inputPassword.classList.remove('error');
            errPassword.classList.remove('visible');
            return true;
        }
    }

    function validateConfirm() {
        const pass = inputPassword.value;
        const confirm = inputConfirm.value;
        const isValid = confirm === pass && confirm.length > 0;
        if (confirm.length > 0 && !isValid) {
            inputConfirm.classList.add('error');
            errConfirm.classList.add('visible');
            return false;
        } else {
            inputConfirm.classList.remove('error');
            errConfirm.classList.remove('visible');
            return true;
        }
    }

    inputEmail.addEventListener('input', validateEmail);
    inputPassword.addEventListener('input', () => { validatePassword(); validateConfirm(); });
    inputConfirm.addEventListener('input', validateConfirm);

    function setRegisterMode() {
        resetToIdle();
        isLoginMode = false;
        hideAlert();

        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');

        formTitle.textContent = 'Создай аккаунт';
        formSubtitle.textContent = 'Мы найдём учебный план по корпоративной почте ТПУ.';
        submitBtn.textContent = 'Создать аккаунт';
        footerText.innerHTML = 'Уже есть аккаунт? <a href="#" id="footer-toggle-link">Войти</a>';

        groupName.style.display = 'block';
        groupPasswordConfirm.style.display = 'block';
        groupAgreement.style.display = 'flex';
        groupCode.style.display = 'none';

        document.getElementById('name').required = true;
        inputConfirm.required = true;
        document.getElementById('code').required = false;

        bindFooterLink();
    }

    function setLoginMode() {
        resetToIdle();
        isLoginMode = true;
        hideAlert();

        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');

        formTitle.textContent = 'С возвращением';
        formSubtitle.textContent = 'Рады видеть тебя снова. Введи свои данные для входа.';
        submitBtn.textContent = 'Войти в аккаунт';
        footerText.innerHTML = 'Нет аккаунта? <a href="#" id="footer-toggle-link">Зарегистрироваться</a>';

        groupName.style.display = 'none';
        groupPasswordConfirm.style.display = 'none';
        groupAgreement.style.display = 'none';
        groupCode.style.display = 'none';

        document.getElementById('name').required = false;
        inputConfirm.required = false;
        document.getElementById('code').required = false;

        inputEmail.classList.remove('error');
        inputPassword.classList.remove('error');
        inputConfirm.classList.remove('error');
        errEmail.classList.remove('visible');
        errPassword.classList.remove('visible');
        errConfirm.classList.remove('visible');

        bindFooterLink();
    }

    function bindFooterLink() {
        setTimeout(() => {
            const link = document.getElementById('footer-toggle-link');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (tabRegister.classList.contains('active')) setLoginMode();
                    else setRegisterMode();
                });
            }
        }, 10);
    }

    tabRegister.addEventListener('click', setRegisterMode);
    tabLogin.addEventListener('click', setLoginMode);
    bindFooterLink();

    function resetToIdle() {
        stage = 'idle';
        if (groupCode) {
            groupCode.style.display = 'none';
            const codeInput = document.getElementById('code');
            if (codeInput) {
                codeInput.value = '';
                codeInput.required = false;
            }
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ================= ЭТАП 2: Проверка кода и регистрация =================
        if (stage === 'awaiting-code') {
            const code = document.getElementById('code').value.trim();
            if (!/^\d{5}$/.test(code)) {
                showAlert('Введи 5-значный код из письма.', 'error');
                return;
            }

            submitBtn.textContent = 'Проверяем...';
            submitBtn.disabled = true;
            hideAlert();

            try {
                const name = inputName.value.trim();
                const password = inputPassword.value;
                const email = inputEmail.value.trim();

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, code })
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    showAlert('Аккаунт успешно создан! Перенаправляем...', 'success');

                    // СТРАХОВКА: Берем имя из ответа сервера, либо из поля ввода
                    const finalName = data.name || name;

                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('userName', finalName);

                    setTimeout(() => {
                        window.location.href = '/profile';
                    }, 1000);
                } else {
                    showAlert(data.error || 'Ошибка регистрации', 'error');
                    submitBtn.textContent = 'Подтвердить';
                    submitBtn.disabled = false;
                }
            } catch (err) {
                showAlert('Не удалось связаться с сервером.', 'error');
                submitBtn.textContent = 'Подтвердить';
                submitBtn.disabled = false;
                console.error(err);
            }
            return;
        }

        // ================= ЭТАП 1 (ВХОД): Проверка пароля =================
        if (isLoginMode) {
            if (!inputEmail.value || !inputPassword.value) {
                showAlert('Введи почту и пароль.', 'error');
                return;
            }

            submitBtn.textContent = 'Входим...';
            submitBtn.disabled = true;
            hideAlert();

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: inputEmail.value.trim(),
                        password: inputPassword.value
                    })
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    showAlert('Успешный вход! Перенаправляем...', 'success');

                    // СТРАХОВКА: Если сервер не вернул имя, ставим заглушку
                    const finalName = data.name || inputEmail.value.split('@')[0];

                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('userName', finalName);

                    setTimeout(() => {
                        window.location.href = '/profile';
                    }, 1500);
                } else {
                    showAlert(data.error || 'Ошибка входа', 'error');
                    submitBtn.textContent = 'Войти в аккаунт';
                    submitBtn.disabled = false;
                }
            } catch (err) {
                showAlert('Не удалось связаться с сервером.', 'error');
                submitBtn.textContent = 'Войти в аккаунт';
                submitBtn.disabled = false;
                console.error(err);
            }
            return;
        }

        // ================= ЭТАП 1 (РЕГИСТРАЦИЯ) =================
        hideAlert();
        const isEmailValid = validateEmail();
        const isPassValid = validatePassword();
        const isConfirmValid = validateConfirm();

        if (!isEmailValid || !isPassValid || !isConfirmValid ||
            !inputEmail.value || !inputPassword.value || !inputConfirm.value) {

            if (!inputEmail.value) { inputEmail.classList.add('error'); errEmail.classList.add('visible'); }
            if (!inputPassword.value) { inputPassword.classList.add('error'); errPassword.classList.add('visible'); }
            if (!inputConfirm.value) { inputConfirm.classList.add('error'); errConfirm.classList.add('visible'); }
            return;
        }

        const email = inputEmail.value.trim();
        submitBtn.textContent = 'Отправляем...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                showCodeStage(email);
            } else {
                showAlert(data.error || 'Неизвестная ошибка сервера', 'error');
            }
        } catch (err) {
            showAlert('Не удалось связаться с сервером.', 'error');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            if (stage === 'idle') {
                submitBtn.textContent = isLoginMode ? 'Войти в аккаунт' : 'Создать аккаунт';
            }
        }
    });

    function showCodeStage(email) {
        stage = 'awaiting-code';
        showAlert(`Код отправлен на ${email}. Проверьте папку «Спам», если письма нет.`, 'success');
        formTitle.textContent = 'Подтверждение почты';
        formSubtitle.textContent = 'Введите 5-значный код из письма';
        submitBtn.textContent = 'Подтвердить';
        groupName.style.display = 'none';
        groupPasswordConfirm.style.display = 'none';
        groupAgreement.style.display = 'none';
        document.getElementById('name').required = false;
        inputConfirm.required = false;
        groupCode.style.display = 'block';
        const codeInput = document.getElementById('code');
        codeInput.required = true;
        codeInput.value = '';
        codeInput.focus();
        footerText.innerHTML = `<a href="#" id="footer-back">← Назад</a>`;
        const back = document.getElementById('footer-back');
        if (back) {
            back.addEventListener('click', (e) => {
                e.preventDefault();
                if (isLoginMode) setLoginMode();
                else setRegisterMode();
            });
        }
    }
});